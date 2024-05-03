let data;

async function reset(refreshAll) {
  const formData = new FormData(document.forms["card_customiser"]);
  if (formData.get("data").size != 0) {
    refreshAll = true;
    data = JSON.parse(await formData.get("data").text());
    document.querySelector("#upload-data").value = "";
  }
  const { lineNumber, schedule, route, lineType, lineTypeColor, topText, bottomText } = data;
  const stopNumber = Number(formData.get("stop") || 0)

  document.querySelector("#schedule").innerHTML = "<tr class='border-b-2 border-black'><th colspan='2'>Cały tydzień</th></tr>";
  if (refreshAll) document.querySelector("#stop_selector").innerHTML = "";

  document.querySelector('#line_number').innerText = lineNumber;
  const lineTypeEl = document.querySelector('#line_type');
  lineTypeEl.className = `text-${lineTypeColor} uppercase text-sm`;
  lineTypeEl.innerText = lineType;

  document.querySelector("#stop_name").innerText = route[stopNumber].name;
  document.querySelector("#destination").innerText = route[route.length - 1].name;
  document.querySelector("#top_text").innerHTML = topText;
  document.querySelector("#bottom-text").innerHTML = bottomText

  const routeDataElement = document.querySelector("#route_data");
  routeDataElement.innerHTML = "";
  for (let stop = 0; stop < route.length; stop++) {
    if (refreshAll) {
      const selectElement = document.createElement('div');
      selectElement.className = "flex items-center"
      selectElement.innerHTML = document.querySelector(".stop-select").innerHTML.replaceAll("{stop}", `${stop}`)
      if (stopNumber === stop) {
        selectElement.querySelector("input").checked = true;
      }
      selectElement.querySelector("label").innerHTML = route[stop].name;

      document.querySelector("#stop_selector").appendChild(selectElement);
    }

    if (stop > 0 && stopNumber > 2 && stop < stopNumber) continue
    const clone = document.querySelector("#template > table > tbody > .route_item").cloneNode(true);

    const stopTime = route[stop].time - route[stopNumber].time;
    if (stopTime > 0) {
      clone.querySelector(".stop_time").innerText = stopTime;
    }

    clone.querySelector(".stop_name").innerText = route[stop].name

    if (stop == stopNumber) {
      clone.querySelector(".stop_name").classList.add("bg-gray-700", "text-white")
    }

    routeDataElement.appendChild(clone);

    if (stop == 0 && stopNumber > 2) {
      const threeDots = document.querySelector("#template > table > tbody > .route_item").cloneNode(true);
      threeDots.querySelector(".stop_name").innerText = "...";
      routeDataElement.appendChild(threeDots)
    }
  }


  let lastHour = Number(schedule[0].split(":")[0] - 1)
  for (const service of schedule) {
    const split = service.split(":")
    let hour = Number(split[0])
    let minutes = Number(split[1].substring(0, 2)) + route[stopNumber].time
    const variant = split[1].substring(2, split[1].length)
    if (minutes > 59) {
      minutes -= 60;
      hour += 1;
    }

    if (lastHour != hour) {
      for (let i = lastHour + 1; i <= hour; i++) {
        const scheduleRow = document.querySelector("#template > table > tbody > .schedule-row").cloneNode(true);
        scheduleRow.id = `schedule-hour-${i}`;
        scheduleRow.firstChild.innerText = i;
        document.querySelector("#schedule").appendChild(scheduleRow);
      }
    }
    lastHour = hour;

    const element = document.querySelector(`#schedule-hour-${hour}`)
    element.lastChild.innerText += ` ${minutes.toLocaleString('pl-PL', { minimumIntegerDigits: 2 })}${variant} `
  }
}

async function fetchData() {
  const response = await fetch('/data.json');
  data = await response.json()
}
// await fetchData();
// reset(true)

document.querySelector("#reset").addEventListener("click", async () => {
  await fetchData();
  await reset(true);
});

document.querySelector("#card_customiser").addEventListener("change", () => {
  reset(false)
});

document.querySelector("#download").addEventListener("click", (evt) => {
  evt.target.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, undefined, 2)));
  evt.target.setAttribute("download", `linia_${data.lineNumber}_${data.route[0].name}_${data.route[data.route.length - 1].name}.json`)
})