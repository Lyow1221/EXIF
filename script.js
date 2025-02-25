"use strict";

let imagePreview = document.getElementById("imagePreview"),
  fileInput = document.getElementById("fileInput"),
  addExifBtn = document.getElementById("addExifBtn"),
  downloadLink = document.getElementById("downloadLink"),
  nameFile = document.getElementById("nameFile"),
  authorInput = document.getElementById("authorInput"),
  descriptionInput = document.getElementById("descriptionInput"),
  commentInput = document.getElementById("commentInput"),
  selectLang = document.getElementById("selectLang");

const err = "No data available.";
addExifBtn.disabled = true;
let langInfo = selectLang.selectedOptions[0].dataset.lang;

let exifDataObj = {
  hy: {
    "👤 Հեղինակ": err,
    "📝 Նկարագրություն": err,
    "💬 Մեկնաբանություն": err,
    "📷 Տեսախցիկ": err,
    "🕒 Նկարահանման ամսաթիվ": err,
    "🗺️ Տեղանք": err,
  },
  en: {
    "👤 Author": err,
    "📝 Description": err,
    "💬 Comment": err,
    "📷 Camera": err,
    "🕒 Date Taken": err,
    "🗺️ Location": err,
  },
  ru: {
    "👤 Автор": err,
    "📝 Описание": err,
    "💬 Комментарий": err,
    "📷 Камера": err,
    "🕒 Дата съемки": err,
    "🗺️ Местоположение": err,
  },
};

let errDuringWork = {
  hy : "Սխալ նկարի մշակման ժամանակ",
  en : "Error while processing image",
  ru : "Ошибка при обработке изображения",
}

let loadedImageData;
let newJpegData;

selectLang.addEventListener("change", function () {
  langInfo = this.options[this.selectedIndex].dataset.lang;

  window.location.href = this.value;
});
fileInput.addEventListener("change", function (event) {
  addExifBtn.disabled = false;
  let file = event.target.files[0];

  if (!file) return;

  let reader = new FileReader();
  reader.onload = function (e) {
    try {
      let jpegData = e.target.result;
      let exifData = piexif.load(jpegData);

      loadedImageData = jpegData;
      imagePreview.src = jpegData;
      console.log(exifData);

      let description;
      if (!exifData["0th"]["270"].startsWith("\u0000")) {
        description = exifData["0th"]["270"];
      } else {
        description = err;
      }
      let userComment = exifData["Exif"]["37510"] || err;
      let make = exifData["0th"]["271"] || err;
      let model = exifData["0th"]["272"] || err;
      let datetime = exifData["0th"]["306"] || err;
      let author = exifData["0th"]["315"] || err;

      let gpsN = exifData["GPS"]["2"];
      let gpsE = exifData["GPS"]["4"];
      let location = gpsFun(gpsN, gpsE);

      console.log(langInfo);
      if (langInfo === "hy") {
        exifDataObj[langInfo]["👤 Հեղինակ"] = author;
        exifDataObj[langInfo]["📝 Նկարագրություն"] = description;
        exifDataObj[langInfo]["💬 Մեկնաբանություն"] = userComment;
        exifDataObj[langInfo]["📷 Տեսախցիկ"] = `${make} ${model}`;
        exifDataObj[langInfo]["🕒 Նկարահանման ամսաթիվ"] = datetime;
        exifDataObj[langInfo]["🗺️ Տեղանք"] = location;
      } else if (langInfo === "ru") {
        exifDataObj[langInfo]["👤 Автор"] = author;
        exifDataObj[langInfo]["📝 Описание"] = description;
        exifDataObj[langInfo]["💬 Комментарий"] = userComment;
        exifDataObj[langInfo]["📷 Камера"] = `${make} ${model}`;
        exifDataObj[langInfo]["🕒 Дата съемки"] = datetime;
        exifDataObj[langInfo]["🗺️ Локация"] = location;
      } else if (langInfo === "en") {
        exifDataObj[langInfo]["👤 Author"] = author;
        exifDataObj[langInfo]["📝 Description"] = description;
        exifDataObj[langInfo]["💬 Comment"] = userComment;
        exifDataObj[langInfo]["📷 Camera"] = `${make} ${model}`;
        exifDataObj[langInfo]["🕒 Date Taken"] = datetime;
        exifDataObj[langInfo]["🗺️ Location"] = location;
      }

      console.log(Object.entries(exifDataObj[langInfo]));

      let exifDataObjText = Object.entries(exifDataObj[langInfo])
        .map(([key, value]) => {
          value = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          if ((key === "🗺️ Տեղանք" || key === "🗺️ Локация" || key === "🗺️ Location") && value !== err) {
            return `${key}: <a id = "locLink" href="https://www.google.com/maps?q=${value}" target="_blank">${value}</a>`;
          }
          return `${key}: ${value}`;
        })
        .join("<br>");

      document.getElementById("exifData").innerHTML = exifDataObjText;
    } catch (error) {
      console.error(errDuringWork[langInfo], error);
      document.getElementById("exifData").innerHTML =
      errDuringWork[langInfo];
    }
  };
  reader.readAsDataURL(file);
});

// ADD EXIF DATA

addExifBtn.addEventListener("click", function () {
  let exifObj = piexif.load(loadedImageData);

  exifObj["0th"]["315"] = authorInput.value.trim() || exifObj["0th"]["315"];
  exifObj["0th"]["270"] =
    descriptionInput.value.trim() || exifObj["0th"]["270"];

  exifObj["Exif"]["37510"] =
    commentInput.value.trim() || exifObj["Exif"]["37510"];

  let exifStr = piexif.dump(exifObj);
  newJpegData = piexif.insert(exifStr, loadedImageData);

  downloadLink.style.display = "block";
  nameFile.style.display = "block";
});

downloadLink.addEventListener("click", function () {
  downloadLink.href = newJpegData;

  downloadLink.download = nameFile.value.trim() || "image.jpg";
  resetInputValue("");
});

let resetInputValue = (empty) => {
  nameFile.value = empty;
  commentInput.value = empty;
  descriptionInput.value = empty;
  authorInput.value = empty;

  downloadLink.style.display = "none";
  nameFile.style.display = "none";
};

let gpsFun = (gpsN, gpsE) => {
  if (!gpsN && !gpsE) return err;
  let latD = gpsN[0][0] / gpsN[0][1] || 0;
  let latM = gpsN[1][0] / gpsN[1][1] || 0;
  let latS = gpsN[2][0] / gpsN[2][1] || 0;

  let lonD = gpsE[0][0] / gpsE[0][1] || 0;
  let lonM = gpsE[1][0] / gpsE[1][1] || 0;
  let lonS = gpsE[2][0] / gpsE[2][1] || 0;

  let lat = latD + latM / 60 + latS / 3600;
  let lon = lonD + lonM / 60 + lonS / 3600;
  if (!isNaN(lat) && !isNaN(lon)) {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
};
