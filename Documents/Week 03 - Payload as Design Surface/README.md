# Week 03 — Payload as Design Surface

## Big idea
This week treats the request/response payload as a **design surface**:
by changing how we construct inputs and how we interpret outputs, we can design different experiences.

## What to do (recommended order)
1) **In-class demo / setup**
   - `Demos/Week 03/Activity 1 - LM Studio Hookup + Payload Inspection/`
2) **Slides**
   - `Slides/Week 03 - Payload as Design Surface.md`
3) **Take-home**
   - `Assignments/Week 03 - Challenges/README.md`

## What you should be able to explain after Week 03
- Where assistant text lives in the response payload: `choices[0].message.content`
- What `messages[]` is doing (and why it’s a design choice)
- What low vs high `temperature` tends to do (stability vs variation)
- Why “the boundary” includes:
  - your payload design
  - the server/runtime behavior (errors, defaults, normalization)

