let store = {
  project: { name: "Mars Rover Dashboard", author: "Cong Dinh", year: "2024" },
  user: { name: "Cong Dinh" },
  apod: "",
  rovers: Immutable.List(["Curiosity", "Opportunity", "Spirit"]),
  photos: Immutable.List([]),
  roverData: Immutable.Map({}),
  selectedRover: "",
  router: {
    currentLink: "/",
    params: {
      pageNumber: 1,
      camera: "",
      earthDate: "",
    },
  },
};

// add our markup to the page
const root = document.getElementById("root");

const updateStore = (store, newState) => {
  store = Object.assign(store, newState);
  render(root, store);
};

const render = async (root, state) => {
  root.innerHTML = App(state);
  const selectedOption = document.getElementById(state.router.params.camera);
  if (selectedOption) {
    selectedOption.selected = true;
  }

  const earthDate = document.getElementById("earth-date");
  if (earthDate) {
    earthDate.value = state.router.params.earthDate;
  }
};

// create content
const App = (state) => {
  let { router, apod } = state;

  const currentPage =
    router.currentLink === "" || router.currentLink === "/"
      ? HomePage(apod)
      : RoverPage(state);

  return `
        ${Header(state)}
        <main class="w-4/5 m-auto py-3">
            ${Greeting(store.user.name)}
            <section>
                ${currentPage}
            </section>
        </main>
        ${Footer(state)}
    `;
};

// listening for load event because page should load before any JS is called
window.addEventListener("load", () => {
  render(root, store);
});

// ------------------------------------------------------  COMPONENTS

const Loading = () => {
  return `<section>
                <div>
                    <p>Loading...</p>
                </div>
            </section>`;
};

const HomePage = (apod) => {
  if (!apod) {
    getImageOfTheDay(store);
    return Loading();
  }

  return `
            <section>
                <h2 class="text-2xl text-center my-3">Astronomy Picture of the Day</h2>
                <div>
                    ${ImageOfTheDay(apod)}
                </div>
            </section>
        `;
};

/**
 * Renders the RoverPage component.
 *
 * @param {object} state - The state object containing roverData, selectedRover, and photos.
 * @returns {string} - The HTML string representing the RoverPage component.
 */
const RoverPage = (state) => {
  const { roverData, selectedRover } = state;

  if (!selectedRover) {
    getRoverData(selectedRover);
    return Loading();
  }

  const { photos } = state;

  if (!roverData) {
    return ErroPage();
  }

  if (roverData.size === 0) {
    return Loading();
  }

  return `<section>
            ${RoverInfo(roverData)}
            ${FilterBar(state)}
            ${photos.size === 0 ? Loading() : RoverPhotos(photos)}
            ${Pagination(state)}
          </section>
    `;
};

const ErroPage = () => {
  return `<section>
            <div class="text-center my-3">
              <h1 class="text-2xl">
                API Error: Unable to fetch data from the server
              </h1>
            </div>
          </section>
    `;
};

const FilterBar = (state) => {
  return `
          <div class="filter-bar flex justify-between items-center border border-slate-400 rounded-md my-3 p-2">
              <div class="select-camera">
                  <label for="camera">Camera:</label>
                  <select id="camera" name="camera" class="border border-slate-400 p-2" onchange="updateCamera(event)">
                      <option value="">Select Camera</option>
                      ${state.roverData?.cameras?.map((camera) => {
                        return `<option id="${camera.name}" value="${camera.name}">${camera.full_name}</option>`;
                      })}
                  </select>
              </div>
              <div class="select-date">
                  <label for="earth-date">Earth Date:</label>
                  <input class="border border-slate-400 p-2" type="date" id="earth-date" name="earth-date" onchange="updateEarthDate(event)">
              </div>
          </div>
      `;
};

const RoverPhotos = (photos) => {
  if (photos.size === 0) {
    return `<div class="text-center my-3">No photos found</div>`;
  }
  return `<div class="grid grid-cols-5 gap-3 my-3">
    ${photos
      .map((photo) => {
        return `
            <div class="border border-slate-400 rounded-md p-3">
                <img src="${photo.img_src}" alt="${photo.camera.full_name}" />
                <div class="photo-info">
                  <h2 class="text-xl">${photo.camera.full_name}</h2>
                  <p class="text-slate-500">Earth Date: ${photo.earth_date}</p>
                </div>
            </div>
          `;
      })
      .filter((x) => x !== ",")
      .join("")}
    </div>
  `;
};

const RoverInfo = (roverData) => {
  return `
          <div class="rover-info my-3">
               <h2 class="text-2xl">${roverData.name}</h2>
               <div class="rover-details">
                   <p class="text-slate-500">Launch Date: ${roverData.launch_date}</p>
                   <p class="text-slate-500">Landing Date: ${roverData.landing_date}</p>
                   <p class="text-slate-500">Status: ${roverData.status}</p>
                   <p class="text-slate-500">Total Photos: ${roverData.total_photos}</p>
               </div>
           </div>`;
};

const Pagination = (state) => {
  const { roverData } = state;
  const { params } = state.router;

  return `
          <div class="pagination flex justify-between items-center">
              <span class="text-slate-500">
                25 images per page
              </span>
              <div class="pagination-buttons">
                <button class="bg-blue-500 min-w-[50px] text-white p-2 rounded-sm mx-2 ${
                  params.pageNumber === 1 ? "bg-slate-200" : ""
                }" 
                  onclick="updatePage(event, 'start')" disable="${
                    params.pageNumber === 1
                  }">&lt;&lt;</button>
                <button class="bg-blue-500 min-w-[50px] text-white p-2 rounded-sm mx-2 ${
                  params.pageNumber === 1 ? "bg-slate-200" : ""
                }" 
                  onclick="updatePage(event, 'prev')" disable="${
                    params.pageNumber === 1
                  }">&lt;</button>
                ${Array.from(
                  { length: Math.ceil(roverData.total_photos / 25) },
                  (_, i) => {
                    if (
                      i >= params.pageNumber - 3 &&
                      i < params.pageNumber + 2
                    ) {
                      return `<button class="bg-blue-500 min-w-[50px] text-white p-2 rounded-sm mx-2 ${
                        params.pageNumber === i + 1 ? "bg-slate-200" : ""
                      }" 
                        onclick="updatePage(event, ${i + 1})">${
                        i + 1
                      }</button>`;
                    }
                  }
                ).join("")}
                <button class="bg-blue-500 min-w-[50px] text-white p-2 rounded-sm mx-2 ${
                  params.pageNumber === Math.ceil(roverData.total_photos / 25)
                    ? "bg-slate-200"
                    : ""
                }" 
                  onclick="updatePage(event, 'next')" disable="${
                    params.pageNumber === Math.ceil(roverData.total_photos / 25)
                  }">&gt;</button>
                  <button class="bg-blue-500 min-w-[50px] text-white p-2 rounded-sm mx-2 ${
                    params.pageNumber === Math.ceil(roverData.total_photos / 25)
                      ? "bg-slate-200"
                      : ""
                  }" 
                  onclick="updatePage(event, 'end')" disable="${
                    params.pageNumber === Math.ceil(roverData.total_photos / 25)
                  }">&gt;&gt;</button>
              </div>
              <span class="text-slate-500">
                Page ${params.pageNumber} of ${Math.ceil(
    roverData.total_photos / 25
  )}
                        </span>
          </div>`;
};

const Header = (state) => {
  // Create li elements for each rover
  const roverList = state.rovers.map((rover) => {
    return `<li>
                <a class="inline-block p-5 hover:bg-blue-500 hover:text-white" id="${rover}" onclick="selectPage(event)">${rover}</a>
            </li>`;
  });
  return `
          <header class="sticky top-0 text-white bg-blue-400">
              <nav class="w-4/5 m-auto flex justify-between items-center">
                  <div class="brand">
                      <a class="text-3xl cursor-pointer" id="home" onclick="selectPage(event)">Mars Rover Dashboard</a>
                  </div>
                  <ul class="flex justify-between items-center">
                      ${roverList.join("")}
                  </ul>
              </nav>
          </header>
      `;
};

const Footer = (state) => {
  return `
          <footer class="p-3 text-center bg-slate-300 fixed bottom-0 w-full">
              <p class="text-xl">${state.project.name} - Created by ${state.project.author} - ${state.project.year}</p>
          </footer>
      `;
};

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Greeting = (name) => {
  if (name) {
    return `<h1 class="text-center text-4xl">Welcome, ${name}!</h1>`;
  }

  return `<h1>Hello!</h1>`;
};

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {
  // If image does not already exist, or it is not from today -- request it again
  const today = new Date();
  const photodate = new Date(apod.date);
  console.log(photodate.getDate(), today.getDate());

  console.log(photodate.getDate() === today.getDate());
  if (!apod || apod.date === today.getDate()) {
    getImageOfTheDay(store);
  }

  // check if the photo of the day is actually type video!
  if (apod.media_type === "video") {
    return `
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `;
  } else {
    if (apod && apod.image) {
      return `
                <img src="${apod.image.url}" height="350px" width="100%" />
                <p>${apod.image.explanation}</p>
            `;
    }
  }
};

// ------------------------------------------------------  EVENT HANDLERS

const updateCamera = (event) => {
  const cameraCode = event.target.value;

  // Add camera code to the router params
  updateStore(store, {
    router: Object.assign(store.router, {
      params: Object.assign(store.router.params, { camera: cameraCode }),
    }),
  });

  getRoverData(store.selectedRover);

  const { params } = store.router;

  let url = `/${store.selectedRover}&page=${params.pageNumber}`;

  if (cameraCode) {
    url = `${url}&camera=${cameraCode}`;
  }

  if (params.earthDate) {
    url = `${url}&earthDate=${params.earthDate}`;
  }

  window.history.pushState({}, "", url);
};

const updateEarthDate = (event) => {
  const inputEarthDate = event.target.value;

  // Add earth date to the router params
  updateStore(store, {
    router: Object.assign(store.router, {
      params: Object.assign(store.router.params, { earthDate: inputEarthDate }),
    }),
  });

  if (inputEarthDate !== "") {
    getRoverData(store.selectedRover);
  }

  const { params } = store.router;

  let url = `/${store.selectedRover}&page=${params.pageNumber}`;

  if (params.camera) {
    url = `${url}&camera=${params.camera}`;
  }

  if (params.earthDate) {
    url = `${url}&earthDate=${params.earthDate}`;
  }

  window.history.pushState({}, "", url);
};

/**
 * Updates the page based on the specified event and page.
 *
 * @param {Event} event - The event that triggered the page update.
 * @param {string|number} page - The page to navigate to. Can be "start", "end", "prev", "next", or a page number.
 */
const updatePage = (event, page) => {
  let pageNumber = store.router.params.pageNumber;

  if (page === "start") {
    if (pageNumber === 1) {
      return;
    }
    pageNumber = 1;
  } else if (page === "end") {
    if (pageNumber === Math.ceil(store.roverData.total_photos / 25)) {
      return;
    }
    pageNumber = Math.ceil(store.roverData.total_photos / 25);
  } else if (page === "prev") {
    if (pageNumber === 1) {
      return;
    }
    pageNumber -= 1;
  } else if (page === "next") {
    if (pageNumber === Math.ceil(store.roverData.total_photos / 25)) {
      return;
    }

    pageNumber += 1;
  } else {
    pageNumber = page;
  }

  let link = `/${store.selectedRover}&page=${pageNumber}`;

  if (store.router.params.camera) {
    link = `${link}&camera=${store.router.params.camera}`;
  }

  if (store.router.params.earthDate) {
    link = `${link}&earthDate=${store.router.params.earthDate}`;
  }

  router = updateStore(store, {
    photos: Immutable.List([]),
    router: Object.assign(store.router, {
      currentLink: link,
      params: Object.assign(store.router.params, { pageNumber }),
    }),
  });

  getRoverData(store.selectedRover);

  const { params } = store.router;

  window.history.pushState({}, "", link);
};

/**
 * Handles the selection of a page and updates the store and router accordingly.
 * @param {Event} event - The event object triggered by the page selection.
 */
const selectPage = (event) => {
  // get rover name
  const roverName = event.target.id;

  if (roverName === "home") {
    updateStore(store, {
      selectedRover: "",
      router: { currentLink: "/", params: { pageNumber: 1 } },
    });
    window.history.pushState({}, "", "/");
    return;
  }

  if (!roverName) {
    return;
  }

  if (store.selectedRover === roverName) {
    return;
  }

  updateStore(store, {
    selectedRover: roverName,
    router: { currentLink: `/${roverName}&page=1`, params: { pageNumber: 1 } },
  });

  const { params } = store.router;

  getRoverData(roverName, params.pageNumber);

  window.history.pushState({}, "", `/${roverName}&page=${params.pageNumber}`);
};

// ------------------------------------------------------  API CALLS

// Example API call
const getImageOfTheDay = (state) => {
  fetch(`http://localhost:3000/apod`)
    .then((res) => res.json())
    .then((apod) => updateStore(store, { apod }));
};

const getRoverData = (roverName) => {
  const { router } = store;
  const params = {
    pageNumber: router.params.pageNumber,
    camera: router.params.camera,
    earthDate: router.params.earthDate,
  };

  const url = new URL(`http://localhost:3000/rover/${roverName}`);

  Object.keys(params).forEach((key) => {
    if (params[key]) {
      url.searchParams.append(key, params[key]);
    }
  });

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      updateStore(store, {
        roverData: data.roverData,
        photos: data.photos,
        selectedRover: roverName,
        router: {
          currentLink: `/${roverName}&page=${params.pageNumber}`,
          params: {
            pageNumber: params.pageNumber,
            camera: params.camera,
            earthDate: params.earthDate,
          },
        },
      });
    })
    .catch((err) => {
      console.log("error:", err);
    });
};
