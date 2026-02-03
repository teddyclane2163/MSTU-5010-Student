function parseArgs(args) {
  let prompt = "";
  let debug = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--prompt" && args[i + 1]) {
      prompt = args[i + 1];
    }
    if (args[i] === "--debug") {
      debug = true;
    }
  }

  return { prompt, debug };
}

function respondToInput(input) {
  const text = (input || "").trim().toLowerCase();
  const greetings = new Set(["hello", "hi", "hey"]);

  if (greetings.has(text)) return "goodbye!";
  return "Not in the mood to greet me today?";
}

function buildRequest({ prompt }) {
  return {
    model: "demo-model",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  };
}

function buildResponse({ assistantText }) {
  return {
    choices: [{ message: { content: assistantText } }]
  };
}

function main() {
  const { prompt, debug } = parseArgs(process.argv.slice(2));

  if (!prompt) {
    console.log('Usage: node index.js --prompt "hello" [--debug]');
    process.exit(1);
  }

  const request = buildRequest({ prompt });
  const assistantText = respondToInput(prompt);
  const response = buildResponse({ assistantText });

  if (debug) {
    console.log("REQUEST JSON:");
    console.log(JSON.stringify(request, null, 2));
    console.log("RESPONSE JSON:");
    console.log(JSON.stringify(response, null, 2));
  } else {
    console.log(assistantText);
  }
}

main();

