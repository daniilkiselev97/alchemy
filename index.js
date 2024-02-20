const STATUS = {
  initial: "initial",
  pending: "pending",
  done: "done",
  error: "error",
};

const STATE = {
  formulas: null,
  images: null,
  names: null,
  dataStatus: STATUS.initial,
  openIds: null,
  filteredIds: null,
};

const DRUGSTATE = {
  element: null,
  offsetX: null,
  offsetY: null,
  matched: null,
};
const DOM = {
  content: document.querySelector(".content"),
  sideBar: document.querySelector(".side-bar"),
  removal: document.querySelector(".delete"),
};

const redrawFilteredEls = () => {
  document.querySelector(".elements").innerHTML = "";
  STATE.filteredIds.forEach((id) => {
    const material = createMaterial(id);
    document.querySelector(".elements").appendChild(material);
  });
};

const makeSearchEls = (str) => {
  if (!str) {
    STATE.filteredIds = STATE.openIds;
    return;
  }
  STATE.filteredIds = STATE.openIds.filter((key) => {
    return STATE.names[key].includes(str);
  });
};

const getData = async () => {
  setStatus(STATUS.pending);

  try {
    const res = await Promise.all([
      getJSON("/assets/formulas.json"),
      getJSON("/assets/images.json"),
      getJSON("/assets/names.ru.json"),
    ]);
    setStatus(STATUS.done);
    STATE.formulas = res[0];
    // console.log(res[0])
    STATE.images = res[1];
    // console.log(res[1])
    STATE.names = res[2];
    // console.log(res[2])
  } catch (error) {
    setStatus(STATUS.error);
    throw Error("Get data error");
  }
};

const getJSON = async (url) => {
  const res = await fetch(url);
  if (res.ok) {
    return await res.json();
  } else {
    throw Error("Rosponse failed");
  }
};
const drawPage = () => {
  if (localStorage.getItem("savedGame")) {
    const parsedStr = localStorage.getItem("savedGame");
    const savedGame = JSON.parse(parsedStr);
    STATE.openIds = savedGame.openIds;
    savedGame.contentEls.forEach((openId) => {
      const createdMaterial = createMaterial(openId.id);
      createdMaterial.style.left = openId.left;
      createdMaterial.style.top = openId.top;
      DOM.content.append(createdMaterial);
    });
  } else {
    const ids = Object.keys(STATE.formulas);
    // console.log(ids)
    const primeIds = ids.filter((id) => {
      const value = STATE.formulas[id];
      // console.log(value)
      return value.prime;
    });
    STATE.openIds = primeIds;
  }

  // console.log(primeIds)
  makeSearchEls();
  redrawFilteredEls();
  document.querySelector(".search-input").addEventListener("input", (e) => {
    const str = e.target.value.trim().toLowerCase();
    // console.log(str)
    makeSearchEls(str);
    redrawFilteredEls();
  });
};
function setPosition(element, left, top) {
  element.style.left = left + "px";
  element.style.top = top + "px";
}
function onDragStart(e) {
  e.preventDefault();
  const material = e.target.closest(".material");
  if (DOM.sideBar.contains(material)) {
    const rect = material.getBoundingClientRect();
    const clone = createMaterial(material.dataset.materialId);
    setPosition(clone, rect.left, rect.top);
    DOM.content.appendChild(clone);
    DRUGSTATE.element = clone;
  } else {
    DRUGSTATE.element = material;
  }

  DRUGSTATE.offsetX = e.offsetX;
  DRUGSTATE.offsetY = e.offsetY;
}
const createMaterial = (id) => {
  const img = STATE.images[id];
  const name = STATE.names[id];

  const rootElement = document.createElement("div");
  const imgElement = document.createElement("img");
  const nameElement = document.createElement("div");

  rootElement.classList.add("material", "draggable");
  rootElement.draggable = true;

  rootElement.ondragstart = onDragStart;
  rootElement.dataset.materialId = id;

  imgElement.classList.add("img");
  imgElement.src = "data:image/png;base64," + img;
  nameElement.classList.add("name");
  nameElement.textContent = name;
  rootElement.appendChild(imgElement);
  rootElement.appendChild(nameElement);

  return rootElement;
};

function findMatchMaterial(e) {
  const condidats = Array.from(DOM.content.querySelectorAll(".material"));
  return condidats.find((el) => {
    const rect = el.getBoundingClientRect();
    if (
      e.pageX > rect.left &&
      e.pageX < rect.right &&
      e.pageY > rect.top &&
      e.pageY < rect.bottom &&
      el !== DRUGSTATE.element
    ) {
      return true;
    }
  });
}
function getMaterialId(el) {
  return +el.dataset.materialId;
}
function findCombination(id1, id2) {
  const inputs = [];
  inputs.push(id1, id2); 
  inputs.sort((a, b) => a - b);
  const ids = Object.keys(STATE.formulas); 

  const searchedId = ids.find((id) => { //1
    let mainArray;
    if (STATE.formulas[id].parents) {
      mainArray = STATE.formulas[id].parents;
    } else {
      return;
    }
    const matched = mainArray.find((pair) => { 
      const sortedPair = pair.sort((a, b) => a - b); 
      if (sortedPair[0] === inputs[0] && sortedPair[1] === inputs[1])
        return true;
    });
    if (matched) {
      return true;
    }
  });
  return searchedId;
}
function saveGame() {
  // debugger
  const materials = Array.from(DOM.content.querySelectorAll(".material"));
  const contentEls = materials.map((item) => {
    return {
      id: item.dataset.materialId,
      top: item.style.top,
      left: item.style.left,
    };
  });

  localStorage.setItem(
    "savedGame",
    JSON.stringify({ openIds: STATE.openIds, contentEls })
  );
}
function shownBoom(left, top) {
  const explosionItem = document.querySelector(".explosion");
  explosionItem.style.visibility = "visible";
  setPosition(explosionItem, left, top);
  setTimeout(() => {
    explosionItem.style.visibility = null;
  }, 1000);
}

const initDragManager = () => {
 
  const btnZoom = document.querySelector(".zoom");
  btnZoom.addEventListener("click", (e) => {
    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    toggleFullScreen()
  });

  document.addEventListener("mousemove", (e) => {
    const dragElement = DRUGSTATE.element;

    const activeEl = DOM.content.querySelector(".frame");
    if (activeEl) {
      activeEl.classList.remove("frame");
    }

    if (dragElement) {
      setPosition(
        dragElement,
        e.pageX - DRUGSTATE.offsetX,
        e.pageY - DRUGSTATE.offsetX
      );
      const element = findMatchMaterial(e);
      console.log("element", element);

      if (element) {
        element.classList.add("frame");
      }
    }
  });
  document.addEventListener("mouseup", (e) => {
    let removalRect = DOM.removal.getBoundingClientRect();
    if (
      e.pageX > removalRect.left &&
      e.pageX < removalRect.right &&
      e.pageY > removalRect.top &&
      e.pageY < removalRect.bottom
    ) {
      DRUGSTATE.element.remove();
    }
    if (DRUGSTATE.element) {
      if (e.pageX > DOM.sideBar.getBoundingClientRect().left) {
        DRUGSTATE.element.remove();
      }

      const element = findMatchMaterial(e);
      if (element) {
        const id2 = getMaterialId(element);
        const id1 = getMaterialId(DRUGSTATE.element);
        const createId = findCombination(id2, id1);
        DRUGSTATE.matched = createId;
        if (createId) {
          const resultingEl = createMaterial(createId);
          const copyResultEl = createMaterial(createId);
          const elementRect = DRUGSTATE.element.getBoundingClientRect();
          shownBoom(elementRect.left, elementRect.top);
          setPosition(resultingEl, elementRect.left, elementRect.top);
          document.querySelector(".content").append(resultingEl);
          if (!STATE.openIds.includes(createId)) {
            STATE.openIds.push(createId);
            document.querySelector(".elements").append(copyResultEl);
          }
          element.remove();
          DRUGSTATE.element.remove();
        }
      }
      DRUGSTATE.element = null;
    }
    saveGame();
  });
};
const ready = async () => {
  await getData();
  drawPage();
  initDragManager();
};
ready();

function setStatus(status) {
  STATE.dataStatus = status;
  const dataStatusElement = document.querySelector(".data-status");
  if (status === STATUS.pending) {
    dataStatusElement.classList.add("visible");
    dataStatusElement.querySelector("h1").innerText = "Загружаем";
  } else if (status === STATUS.error) {
    dataStatusElement.classList.add("visible");
    dataStatusElement.querySelector("h1").innerText = "Ошибка загрузки";
  } else if (status === STATUS.done) {
    dataStatusElement.classList.remove("visible");
  }
}
