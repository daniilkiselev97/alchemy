const STATUS = {
  initial: "initial",
  pending: "pending",
  done: "done",
  error: "error",
};

const STATE = {
  formula: null,
  images: null,
  names: null,
  dataStatus: STATUS.initial,
};

const getData = async () => {
  setStatus(STATUS.pending);

  try {
    const res = await Promise.all([
      getJSON("/assets/base.json"),
      getJSON("/assets/images.json"),
      getJSON("/assets/names.ru.json"),
    ]);
    setStatus(STATUS.done);
    STATE.formula = res[0];
    STATE.images = res[1];
    STATE.names = res[2];

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

const ready = async () => {
  await getData();
  console.log(STATE);
};
ready();

function setStatus (status)  {
  STATE.dataStatus = status;
  const dataStatusElement = document.querySelector('.data-status');
  if(status === STATUS.pending) {
    dataStatusElement.classList.add('visible');
    dataStatusElement.querySelector('h1').innerText = 'Загружаем'
  } else if (status === STATUS.error) {
    dataStatusElement.classList.add('visible');
    dataStatusElement.querySelector('h1').innerText = 'Ошибка загрузки'
  } else if (status === STATUS.done){
    dataStatusElement.classList.remove('visible');
  }
};
