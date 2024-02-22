const API_URL = "http://localhost:3000";
let counter = 0;

async function consumeApi(signal) {
  const response = await fetch(API_URL, {
    signal,
  });

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJson());

  return reader;
}

function appendToHtml(element) {
  return new WritableStream({
    write({ title, description, url_anime }) {
      const card = `
        <article>
          <div class="text">
            <h3>[${++counter}] ${title}</h3>
            <p>${description.slice(0, 100)}</p>
            <a href="${url_anime}">URL do anime</a>
          </div>
        </article>
      `;

      element.innerHTML += card;
    },
    abort(reason) {
      console.log("aborted!", reason);
    },
  });
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

const [start, stop, cards] = ["start", "stop", "cards"].map((item) =>
  document.getElementById(item)
);

let abortController = new AbortController();

start.addEventListener("click", async () => {
  const readable = await consumeApi(abortController.signal);
  readable.pipeTo(appendToHtml(cards));
});

stop.addEventListener("click", () => {
  abortController.abort();
  console.log("aborting...");
  abortController = new AbortController();
});
