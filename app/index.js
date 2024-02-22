const API_URL = "http://localhost:3000";

async function consumeApi(signal) {
  const response = await fetch(API_URL, {
    signal,
  });

  let counter = 0;

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJson())
    .pipeTo(
      new WritableStream({
        write(chunk) {
          console.log(++counter, "chunk", chunk);
        },
      })
    );

  return reader;
}

function parseNDJson() {
  let ndJsonBuffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      ndJsonBuffer += chunk;

      const items = ndJsonBuffer.split("\n");

      items.slice(0, -1).forEach((item) => {
        controller.enqueue(JSON.parse(item));
      });

      ndJsonBuffer = items[items.length - 1];
    },
    flush(controller) {
      if (!ndJsonBuffer) return;
      controller.enqueue(JSON.parse(ndJsonBuffer));
    },
  });
}

const abortController = new AbortController();
await consumeApi(abortController.signal);
