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

const createMaterial = (id) => {
  const img = STATE.images[id];
  const name = STATE.names[id];

  const rootElement = document.createElement("div");
  const imgElement = document.createElement("img");
  const nameElement = document.createElement("div");

  rootElement.classList.add("material", "draggable");

  imgElement.classList.add("img");
  imgElement.src = "data:image/png;base64," + img;
  nameElement.classList.add("name");
  nameElement.textContent = name;
  rootElement.appendChild(imgElement);
  rootElement.appendChild(nameElement);

  return rootElement;
};
const initDragManager = () => {
  DragManager.onDragCancel = function (dragObject) {
    dragObject.avatar.rollback();
    console.log(dragObject);
  };
  DragManager.onDragEnd = function (dragObject, dropElem) {
    // console.log(document.querySelector('.side-bar').getBoundingClientRect())
    // console.log(dragObject.avatar.getBoundingClientRect())
    const avatarRect = dragObject.avatar.getBoundingClientRect();
    const sideBarRect = document
      .querySelector(".side-bar")
      .getBoundingClientRect();
    if (avatarRect.x > sideBarRect.x) {
      dragObject.avatar.rollback();
    }
    // dragObject.elem.style.display = "none";
    // dropElem.classList.add("computer-smile");
    // setTimeout(function () {
    //   dropElem.classList.remove("computer-smile");
    // }, 200);
    console.log(dragObject, dropElem);
  };
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
