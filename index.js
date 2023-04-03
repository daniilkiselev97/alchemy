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
  const ids = Object.keys(STATE.formulas);
  // console.log(ids)
  const primeIds = ids.filter((id) => {
    const value = STATE.formulas[id];
    // console.log(value)
    return value.prime;
  });
  // console.log(primeIds)
  primeIds.forEach((id) => {
    const material = createMaterial(id);
    document.querySelector(".elements").appendChild(material);
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
      el!== DRUGSTATE.element
    ) {
      return true
    } 
  });
}
function getMaterialId(el){
  return +el.dataset.materialId
}
function findCombination(id1, id2){

}
const initDragManager = () => {
  document.addEventListener("mousemove", (e) => {
    const dragElement = DRUGSTATE.element;
    if (dragElement) {
      setPosition(
        dragElement,
        e.pageX - DRUGSTATE.offsetX,
        e.pageY - DRUGSTATE.offsetY
      );
    }
  });
  document.addEventListener("mouseup", (e) => {
    if (DRUGSTATE.element) {
      if (e.pageX > DOM.sideBar.getBoundingClientRect().left) {
        DRUGSTATE.element.remove();
      }
      const element = findMatchMaterial(e)
      if(element){
        const id2 = getMaterialId(element)
        const id1 = getMaterialId(DRUGSTATE.element)
        const createId = findCombination(id2,id1)

      }
      DRUGSTATE.element = null;

    }
  });
};
const ready = async () => {
  await getData();
  // console.log(STATE);
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
