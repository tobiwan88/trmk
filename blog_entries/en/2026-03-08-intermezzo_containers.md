---
title: "Intermezzo: New MacBook & Apple Containers"
date: "2026-03-08"
---
# Fresh Start: Switching from Colima to Apple Containers

New MacBook, clean slate. Instead of just migrating everything over, I took the chance to rethink my local container setup.

## Why Not Just Use Colima Again?

Colima worked fine for a while, but after long runtimes – and especially when a new container instance was started for each build – it started feeling sluggish. Build times crept up and the overhead became noticeable. With a fresh machine I didn't want to carry that baggage over, and it was a good excuse to check out [Apple Containers](https://github.com/apple/container).

Apple Containers is the natural alternative – better integrated with macOS, more optimized, and with 32GB of RAM there's also room to experiment with local models down the line. Not unlimited, but enough for some smaller ones. 

## Apple Containers – What's the Difference?

At a high level: Colima spawns a single VM (Lima) that is shared across all your containers. Apple Containers create one lightweight VM per container. Additionally, Apple Containers are generally better integrated with Apple tooling. For my single-container setup, the I/O performance improvement is what matters most.

## Redoing the Devfile

The Dockerfile needed a refresh anyway. It is based on the Zephyr base image, merged together with the dev container setup. One thing that caught me early: the default memory limit of 1GB is way too low for a Zephyr build environment. Bumping it to 8GB was the first fix.

The setup follows a three-stage build to keep the final image lean:

```dockerfile
# syntax=docker/dockerfile:1.7
ARG DEBIAN_VERSION=trixie-slim
ARG ZEPHYR_VERSION=v4.3.0
ARG TOOLCHAIN_VERSION=0.17.4
ARG TOOLCHAINS=arm-zephyr-eabi

# --- STAGE 1: BASE OS & GUI TOOLS ---
FROM debian:${DEBIAN_VERSION} AS base-env
ENV DEBIAN_FRONTEND=noninteractive

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates python3 python3-venv python3-pip git cmake ninja-build \
    device-tree-compiler make gcc libc6-dev gperf ccache dfu-util xz-utils \
    file libmagic1 sudo zsh curl wget locales libsdl2-dev libx11-6 \
    x11-apps xauth \
    xvfb x11vnc clangd clang-format \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -r zephyr && useradd -m -r -g zephyr -s /usr/bin/zsh zephyr \
    && echo "zephyr ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# --- STAGE 2: BUILDER (Heavy lifting) ---
FROM base-env AS builder

ARG ZEPHYR_VERSION
ARG TOOLCHAIN_VERSION
ARG TOOLCHAINS

USER zephyr
WORKDIR /home/zephyr

RUN python3 -m venv ~/.venv && \
    ~/.venv/bin/pip install --no-cache-dir --upgrade pip setuptools wheel && \
    ~/.venv/bin/pip install --no-cache-dir west && \
    ~/.venv/bin/pip cache purge

ENV PATH="/home/zephyr/.venv/bin:${PATH}"
RUN set -ex && \
    west init -m https://github.com/zephyrproject-rtos/zephyr --mr ${ZEPHYR_VERSION} -o=--depth=1 zephyrproject && \
    cd zephyrproject && \
    west update && \
    west zephyr-export && \
    west packages pip --install && \
    west sdk install --version ${TOOLCHAIN_VERSION} --install-dir /home/zephyr/zephyr-sdk --toolchains ${TOOLCHAINS} -H && \
    cd /home/zephyr && \
    rm -rf zephyrproject && \
    cd /home/zephyr/zephyr-sdk && \
    find . -name "share/doc" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name "share/man" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name "share/info" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name "*.html" -delete 2>/dev/null || true && \
    find . -name "*.pdf" -delete 2>/dev/null || true && \
    find . -name "*.md" -delete 2>/dev/null || true && \
    find . -name "*.txt" -delete 2>/dev/null || true && \
    find . -name "*.a" ! -name "lib*.a" -delete 2>/dev/null || true && \
    find . -name "*.debug" -delete 2>/dev/null || true && \
    find /home/zephyr/.venv -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find /home/zephyr/.venv -name "*.pyc" -delete 2>/dev/null || true && \
    find /home/zephyr/.venv -name "*.pyo" -delete 2>/dev/null || true

# --- STAGE 3: FINAL RUNTIME ---
FROM base-env AS final

ARG ZEPHYR_VERSION
ARG TOOLCHAIN_VERSION
ARG TOOLCHAINS

COPY --from=builder --chown=zephyr:zephyr /home/zephyr/.venv /home/zephyr/.venv
COPY --from=builder --chown=zephyr:zephyr /home/zephyr/zephyr-sdk /home/zephyr/zephyr-sdk

USER zephyr
WORKDIR /home/zephyr

RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended && \
    curl -fsSL https://claude.ai/install.sh | bash

ENV PATH="/home/zephyr/.venv/bin:/home/zephyr/.local/bin:${PATH}" \
    ZEPHYR_TOOLCHAIN_VARIANT=zephyr \
    ZEPHYR_SDK_INSTALL_DIR=/home/zephyr/zephyr-sdk \
    DISPLAY=:1 \
    LIBGL_ALWAYS_SOFTWARE=1 \
    SHELL=/usr/bin/zsh \
    TERM=xterm-256color

WORKDIR /home/zephyr/workspace
CMD ["/usr/bin/zsh"]
```
## DNS Setup

Apple Containers has its own DNS tooling. Setting up a local `.dev` domain for the container network:

```bash
sudo container system dns create dev
container system property set dns.domain dev
```

## Starting the Container

I added a small startup script for `container`, as it is not a drop-in replacement for `docker`.
```bash
INSTANCE_NAME="zephyr_dev_instance"
IMAGE_NAME="zephyr_dev"
WORKSPACE_DIR="$(pwd)"

container build -t "$IMAGE_NAME" --file Dockerfile  .

container run -it \
    --name "$INSTANCE_NAME" \
    --publish 127.0.0.1:5900:5900 \
    --volume "$WORKSPACE_DIR:/home/zephyr/workspace" \
    --volume "$HOME/.claude:/home/zephyr/.claude" \
    --env DISPLAY=":1" \
    --env LIBGL_ALWAYS_SOFTWARE="1" \
    --env SDL_VIDEODRIVER="x11" \
    --memory 8g \
    --cpus 8 \
    --rm "$IMAGE_NAME" \
    zsh
```

The networking works a bit differently – each container gets its own unique IP:

```
container inspect zephyr_dev_instance | jq -r '.[0].networks'
```

```
[
  {
    "ipv4Address": "192.168.64.22/24",
    "hostname": "zephyr_dev_instance.dev.",
    "ipv4Gateway": "192.168.64.1",
    "network": "default",
    "macAddress": "f6:36:fa:00:d0:1a"
  }
]
```

With the container and DNS set up, we can now forward the X session for the LVGL Zephyr build.

## Forwarding the Screen

Screen start script:
```
#!/usr/bin/env bash
set -euo pipefail

DISPLAY_NUM=:1
VNC_PORT=5900
# Slightly smaller geometry is often better for emulated Zephyr screens
SCREEN_GEOMETRY="800x600x24"

# --- Xvfb ---
if pgrep -x Xvfb > /dev/null 2>&1; then
    echo "[start-display] Xvfb already running"
else
    echo "[start-display] Starting Xvfb on ${DISPLAY_NUM}"
    # Added -screen 0 800x600x24 to match typical Zephyr simulation sizes
    Xvfb "${DISPLAY_NUM}" -screen 0 "${SCREEN_GEOMETRY}" -noreset -extension MIT-SHM &

    for i in $(seq 1 10); do
        [ -S "/tmp/.X11-unix/X${DISPLAY_NUM#:}" ] && break
        sleep 0.5
    done
fi

# --- x11vnc ---
if pgrep -x x11vnc > /dev/null 2>&1; then
    echo "[start-display] x11vnc already running"
else
    echo "[start-display] Starting x11vnc on port ${VNC_PORT}"
    # CHANGES: Added -passwd zephyr and -listen 0.0.0.0
    x11vnc -display "${DISPLAY_NUM}" \
           -rfbport "${VNC_PORT}" \
           -forever \
           -passwd zephyr \
           -listen 0.0.0.0 \
           -noxdamage \
           -noshm   \
           -bg
fi

echo "[start-display] Virtual display ready — connect VNC to localhost:${VNC_PORT} (pw: zephyr)"

```

To connect to the remote screen:

```
open vnc://zephyr_dev_instance.dev:5900
```

And just like that, we're back where we left off last week – Zephyr compiling in an isolated container, Claude yolo mode ready.
