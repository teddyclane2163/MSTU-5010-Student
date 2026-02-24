# Week 05 - Boids Project

An emotion-driven flocking simulation. You describe how you're feeling, pick a critter, and an LLM translates your emotional state into parameters that control how a flock of 300 critters moves on screen.

## Getting Started

1. Make sure [LM Studio](https://lmstudio.ai/) is running with a model loaded on `http://localhost:1234`.

2. From this folder, run:
   ```
   npm start
   ```
   
3. Open `http://localhost:8787` in your browser.

## How to Use the Program

### Input Panel

When the page loads, a panel appears in the center of the screen with two inputs:

- **Text field** — Type a sentence describing how you're feeling (e.g., "I'm anxious about an exam tomorrow" or "I feel calm and content").

- **Critter buttons** — Choose one of five animals: Bird, Horse, Butterfly, Monkey, or Shark. Each critter influences the simulation differently based on the animal's real-world behavior.

Once both fields are filled in, click **Start**. The LLM will process your inputs and the simulation begins.

The input panel can be minimized with the **minus button** in its top-right corner. When minimized, a small **Input** circle appears in the bottom-left corner to reopen it. Click **Restart** to clear everything and try again.

### Parameter Overlay

After the simulation starts, a small overlay appears in the **top-right corner** showing the five parameter values the LLM chose. Hover over any parameter name to see a tooltip explaining what it controls.

### JSON Button

The **JSON** circle in the bottom-right corner opens a modal displaying the full raw JSON response from the LLM. This includes the numerical parameters, the `emotional_rationale` and `critter_rationale` text fields explaining how the LLM interpreted your inputs, the `critter_influence` deltas, and the arousal/valence scores. It also reports whether the LLM needed any retries to produce valid JSON.

## Testing the AI Boundary

Try these experiments to see how the LLM interprets different inputs:

- **Same prompt, different critters** — Type "I feel energetic and excited" and run it once with Bird, then Restart and run it again with Shark. Compare the JSON output. Pay attention to any changes and consistencies you notice between trials.

- **Same critter, different prompts** — Pick Butterfly both times, but try "I'm exhausted and sad" vs. "I'm bursting with joy." Pay attention to any changes and consistencies you notice between trials.

- **Extreme emotions** — Try very intense inputs ("I'm furious and overwhelmed") vs. very neutral ones ("I feel okay"). See how the parameter spread changes.

Read the `emotional_rationale` and `critter_rationale` fields in the JSON output to understand the LLM's reasoning for each run.

## How Boids Work

"Boids" is a flocking simulation originally developed by Craig Reynolds in 1986. Each critter (a "boid") follows a set of parameters and, from these, complex group behavior emerges from their combination:

### Parameters

- **Separation** (1-10) — Steer away from neighbors that are too close. This prevents critters from clumping into a single point. Each boid has a "protected range" (35% of its perception radius); any neighbor inside that range pushes the boid away.

- **Alignment** (1-10) — Steer toward the average heading of nearby neighbors. This is what makes the flock move in the same general direction. Each boid looks at the velocities of neighbors within its perception radius and adjusts to match.

- **Cohesion** (1-10) — Steer toward the center mass of nearby neighbors. This pulls the flock together and prevents it from scattering. Each boid calculates the average position of visible neighbors and moves toward it.

- **Perception Radius** (30-120 px) — How far each boid can "see." A larger radius means each boid reacts to more distant neighbors, producing broader group coordination. A smaller radius creates tighter, more localized clusters.

- **Velocity** (1-10) — How fast the boids move. Higher velocity means faster movement across the screen.

### The Hero Boid

One boid is randomly selected as the "hero." It is drawn slightly larger and has two visual aids: a faint circle showing its perception radius, and a red arrow showing its current velocity direction.

## How the LLM Influences Parameters

The LLM generates parameter values through a two-step process:

### Step 1: Emotion Analysis

The LLM analyzes your text input using the **arousal-valence model of emotion** — a two-dimensional framework where arousal measures how calm or agitated you feel (-10 to 10) and valence measures how positive or negative the emotion is (-10 to 10). From these scores, it computes **base values** for all five parameters.

### Step 2: Critter Adjustment

The LLM then applies a **delta** (positive or negative shift) to each base value based on the selected critter's real-world behavior. For example:
- Sharks are solitary predators, so they get increased separation and decreased cohesion.
- Horses are herd animals, so they get increased alignment and cohesion.
- Butterflies rely on short-range senses, so they get a large negative delta to perception radius.

### The Weight System

In the simulation code, the LLM's parameter values (integers 1-10) are converted into **weights** that scale each force. The default value for each parameter is 5, which produces a weight of 1.0 (i.e., no scaling). The formula is:

```
weight = parameter_value / 5
```

So a separation value of 10 produces a weight of 2.0 (double the default force), while a value of 2 produces a weight of 0.4 (less than half). This means the LLM's choices directly amplify or dampen each flocking force relative to the baseline.

Perception radius and velocity are not vectors that can be weighted like the other parameters and must work differently — they are used as direct pixel distances and speed multipliers, i.e. scalar quantities rather than vector weights.
