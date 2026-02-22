---
title: "Let's vibe code a weather station - zephyr style"
date: "2026-02-21"
---

# Let's vibe code a weather station – Zephyr style


![Me Vibing around](../img/PXL_20260222_103831977.jpg)

After modernizing my website and blog workflow with Claude, I wanted to see how far I could push AI-assisted development for a real embedded project. The goal: build a weather station using Zephyr RTOS, with a simulated display and fake sensor data, all orchestrated by Claude in a true "vibe coding" session.

**Long-term, the vision is to create a full multi-sensor system—eventually running on real hardware. Claude should not only help with the firmware, but also support board selection (devkit phase 2), and later even schematic and PCB layout development (phase 3). The idea is to push AI assistance as far as possible, from simulation to physical product.**

![High level idea of the Display](../img/PXL_20260221_095505761.MP.jpg)

Right now, we're in **phase 1: native_sim**. The focus is on building the gateway node with a display, and getting at least the LVGL UI running in simulation before moving to hardware.

## Why Zephyr and Vibe Coding?

![My friend claude](../img/Screenshot 2026-02-22 at 11.42.02.png)

Zephyr is a modern RTOS with great modularity, and I wanted to experiment with its decoupled architecture (zbus, multiple nodes, etc.)—but also see if Claude could help me get from idea to running code faster, and with less yak-shaving. The plan: start with `native_sim` for rapid iteration, then move to real hardware later. As a reference, I pointed Claude to [tiacsys/bridle](https://github.com/tiacsys/bridle), a solid Zephyr starter project.


## The Process: AI as Coding Copilot

I began by feeding Claude some baseline requirements and architectural ideas. The workflow quickly became a back-and-forth: Claude would propose code, I'd review, clarify, and sometimes nudge it back on track. We iterated on the event system, decoupling modules, and even generated a "start prompt" and architecture doc to keep things organized (all in the repo, of course).

### Sensor Event Struct: From Monolith to Scalable

One of the first architectural hurdles was how to represent sensor data. Claude initially suggested a monolithic struct for each measurement type:

```c
/* REJECTED — does not scale */
struct env_sensor_data {
	int32_t temperature_milli_c;
	int32_t humidity_milli_pct;
	int32_t pressure_pa;
	int64_t timestamp_ms;
};
```

This quickly became unmanageable as more sensor types were added. After some discussion, we landed on a much more scalable, transport-friendly format:

```c
/**
 * @brief Sensor measurement event transmitted on sensor_event_chan.
 *
 * Exactly 20 bytes on 32-bit and 64-bit: __packed removes struct-level
 * alignment padding.  No pointers; safe to copy over any transport (LoRa).
 */
struct env_sensor_data {
	uint32_t sensor_uid;   /**< DT-assigned unique sensor identifier   */
	enum sensor_type type; /**< Physical quantity (enum is 32-bit)     */
	int32_t q31_value;     /**< Q31 fixed-point encoded measurement    */
	int64_t timestamp_ms;  /**< k_uptime_get() at sample time, ms      */
} __packed;
```

This version is compact, extensible, and safe to transmit over any transport (like LoRa). No pointers, no padding, and each event is self-describing.

Another early proposal was to use a tightly coupled "sensor manager" that handled all sensors directly. Instead, we moved to a more decoupled approach using Zephyr's zbus, letting each sensor node publish its own events independently. This makes the system much more modular and easier to extend.
I also added some images as initial points for the architecture, and we worked on initial ADR, i still need to do a better review of them i already found some things i did not like, the backlog is growing.
![Network in the future](../img/PXL_20260221_094631791.jpg)
![Zbus ideas](../img/PXL_20260221_095500635.jpg)

### What Worked Well

- **Rapid Prototyping:** With Claude, I could throw out ideas and get working code or architectural suggestions in minutes. Adding new features (like a fake sensor or display logic) was fast—just describe the goal and let the AI do the heavy lifting.
- **Parallel Productivity:** While Claude crunched on code, I could review, test, or even take a bike break. The AI handled boilerplate and repetitive tasks, freeing me up for higher-level design.
- **Documentation Generation:** Claude auto-created architecture docs and even helped maintain a living `claude.md` for project structure and conventions.

![Native sim runs](../img/Screenshot 2026-02-22 at 11.45.18.png)

### The Challenges

- **Context and Rate Limits:** Hitting token limits is the new "out of memory"—especially with Zephyr's complexity. Sometimes, context would get compressed and I'd have to re-explain requirements or point Claude to the right files.
- **Sidetracking:** The AI sometimes wandered off, proposing over-engineered solutions or getting stuck on tangents. A simple backlog helped keep things focused.
- **Devcontainer Woes:** My devcontainer setup was a bit broken, but Claude guided me to a working solution. Still, container resets and network quirks (like SNTP not working) were annoying.
- **Struct Design:** The initial `sensor_event_struct` design was too monolithic. After some back-and-forth, we refactored for better scalability and decoupling.

Some of these challenges are not yet fully solved and will probably require deeper research and hands-on debugging on my part.


### Lessons Learned

- **Guide the AI:** The more you know your system, the better you can steer Claude. Vague prompts lead to inefficient or unscalable proposals.
- **Living Documentation:** Keeping `claude.md` up to date and doing regular architectural reviews pays off—just like in any good software project.
- **Small Steps Win:** Focus on incremental changes, review often, and don't be afraid to course-correct.


### What Still Annoys Me

- **Redundant Research:** Sometimes Claude would re-read files or run lots of grep commands, even after I'd pointed it to the right place. Output can get verbose, so review takes time.
- **Similar Command Confusion:** Allowing similar commands in the skill set can be annoying—need to check the docs to fix this.


## Next Steps

- Optimize Claude usage: prepare skills, clarify prompts, and keep the backlog tight.
- Get LVGL running fully for the display MVP
- Fix the main Docker container issues and network quirks.
- Share the start prompt and architecture docs on GitHub.

## Conclusion

Vibe coding a Zephyr-based weather station with Claude was both fun and productive. The AI shines at boilerplate, documentation, and rapid prototyping—but still needs a human in the loop for architecture and focus. With a bit more structure and better prompt discipline, I can see this workflow scaling to even bigger embedded projects.

**Code and docs:** Everything is (or will be) on GitHub. If you're curious, check out the repo, suggest improvements, or try vibe coding your own embedded project!

**Project GitHub:** [github.com/tobiwan88/weather-station](https://github.com/tobiwan88/weather-station)