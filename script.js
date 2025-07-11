let images = [null, null];
let tiePoints = [[], []];
let controlPoints = [];
let mergedImageData = null;
let currentControlPoint = null;
let geoTransform = null;

function showStep(step) {
  // Hide all steps
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`step${i}`).classList.remove("active");
    document.querySelectorAll(".step-btn")[i - 1].classList.remove("active");
  }

  // Show selected step
  document.getElementById(`step${step}`).classList.add("active");
  document.querySelectorAll(".step-btn")[step - 1].classList.add("active");

  // Copy merged canvas to step 3 and 4
  if (step === 3 && mergedImageData) {
    copyCanvasContent("mergedCanvas", "mergedCanvas3");
  }
  if (step === 4 && mergedImageData) {
    copyCanvasContent("mergedCanvas", "mergedCanvas4");
    calculateGeoTransform();
  }
}

function loadImage(imageNum) {
  const input = document.getElementById(`image${imageNum}Input`);
  const canvas = document.getElementById(`canvas${imageNum}`);
  const ctx = canvas.getContext("2d");

  if (input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // Scale image to fit canvas while maintaining aspect ratio
        const maxWidth = 500;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        images[imageNum - 1] = img;
        checkProceedStep2();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function addTiePoint(imageNum, event) {
  const canvas = document.getElementById(`canvas${imageNum}`);
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left; //click coordinates - offset from canvas
  const y = event.clientY - rect.top;

  // Scale coordinates to canvas size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const actualX = x * scaleX;
  const actualY = y * scaleY;

  tiePoints[imageNum - 1].push({ x: actualX, y: actualY });

  // Draw point on canvas
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(actualX, actualY, 5, 0, 2 * Math.PI);
  ctx.fill();

  // Add point number
  ctx.fillStyle = "#fff";
  ctx.font = "12px Arial";
  ctx.fillText(tiePoints[imageNum - 1].length, actualX + 8, actualY - 8);

  updatePointsList(imageNum);
  checkProceedStep2();
}

function updatePointsList(imageNum) {
  const pointsList = document.getElementById(`points${imageNum}`);
  const points = tiePoints[imageNum - 1];

  pointsList.innerHTML = "<h4>Vezne točke:</h4>";
  points.forEach((point, index) => {
    const pointDiv = document.createElement("div");
    pointDiv.className = "point-item";
    pointDiv.innerHTML = `
                    <span class="point-coords">Točka ${
                      index + 1
                    }: (${Math.round(point.x)}, ${Math.round(point.y)})</span>
                    <button class="delete-btn" onclick="deleteTiePoint(${imageNum}, ${index})">×</button>
                `;
    pointsList.appendChild(pointDiv);
  });
}

function deleteTiePoint(imageNum, index) {
  tiePoints[imageNum - 1].splice(index, 1);

  // Redraw canvas
  const canvas = document.getElementById(`canvas${imageNum}`);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (images[imageNum - 1]) {
    ctx.drawImage(images[imageNum - 1], 0, 0, canvas.width, canvas.height);

    // Redraw remaining points
    tiePoints[imageNum - 1].forEach((point, i) => {
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "12px Arial";
      ctx.fillText(i + 1, point.x + 8, point.y - 8);
    });
  }

  updatePointsList(imageNum);
  checkProceedStep2();
}

function clearTiePoints() {
  tiePoints = [[], []];

  // Redraw both canvases
  for (let i = 1; i <= 2; i++) {
    const canvas = document.getElementById(`canvas${i}`);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (images[i - 1]) {
      ctx.drawImage(images[i - 1], 0, 0, canvas.width, canvas.height);
    }

    updatePointsList(i);
  }

  checkProceedStep2();
}

function checkProceedStep2() {
  const btn = document.getElementById("proceedStep2");
  const hasImages = images[0] && images[1];
  const hasPoints = tiePoints[0].length >= 2 && tiePoints[1].length >= 2;
  const equalPoints = tiePoints[0].length === tiePoints[1].length;

  btn.disabled = !(hasImages && hasPoints && equalPoints);

  if (hasImages && hasPoints && !equalPoints) {
    document.querySelector(".status-info")?.remove();
    const instruction = document.querySelector("#step1 .instruction");
    const status = document.createElement("div");
    status.className = "status-info";
    status.textContent = `Potrebujete enako število veznih točk na obeh slikah. Slika 1: ${tiePoints[0].length}, Slika 2: ${tiePoints[1].length}`;
    instruction.parentNode.insertBefore(status, instruction.nextSibling);
  }
}

function mergeImages() {
  if (!images[0] || !images[1] || tiePoints[0].length < 2) {
    alert("Potrebujete obe sliki in vsaj 2 vezni točki na vsaki sliki.");
    return;
  }

  const canvas = document.getElementById("mergedCanvas");
  const ctx = canvas.getContext("2d");

  // Calculate transformation matrix using tie points
  const transform = calculateTransformation();

  // Create merged canvas with enough space
  const maxWidth = Math.max(images[0].width, images[1].width) * 2;
  const maxHeight = Math.max(images[0].height, images[1].height) * 2;

  canvas.width = maxWidth;
  canvas.height = maxHeight;

  // Clear canvas
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw first image at center
  const offsetX = maxWidth / 4;
  const offsetY = maxHeight / 4;
  ctx.drawImage(images[0], offsetX, offsetY);

  // Draw second image with calculated transformation
  ctx.save();
  ctx.globalAlpha = 0.7;

  // Apply transformation matrix
  ctx.translate(offsetX, offsetY); // Move to same base position as first image
  ctx.transform(
    //afine transformation matrix
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f
  );

  ctx.drawImage(images[1], 0, 0);
  ctx.restore();

  // Mark tie points on merged image (adjusted for offset)
  tiePoints[0].forEach((point, i) => {
    ctx.fillStyle = "#27ae60";
    ctx.beginPath();
    ctx.arc(point.x + offsetX, point.y + offsetY, 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText(`V${i + 1}`, point.x + offsetX + 10, point.y + offsetY - 10);
  });

  mergedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  document.getElementById("proceedStep3").disabled = false;
}

function calculateTransformation() {
  if (tiePoints[0].length < 2 || tiePoints[1].length < 2) {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; // Identity matrix, no changes
  }

  //maps points from image2 to image1 coordinate system
  const n = Math.min(tiePoints[0].length, tiePoints[1].length);

  // For affine transformation:[x'] = [a c e] [x]
  //                           [y']   [b d f] [y]
  //                           [1 ]   [0 0 1] [1]

  // image1_points = T * image2_points

  if (n === 2) {
    // Simple case with 2 points - calculate basic transformation
    const p1_src = tiePoints[1][0]; // source (image2)
    const p1_dst = tiePoints[0][0]; // destination (image1)
    const p2_src = tiePoints[1][1];
    const p2_dst = tiePoints[0][1];

    // Calculate scale and rotation from the two point pairs
    const dx1 = p2_src.x - p1_src.x;
    const dy1 = p2_src.y - p1_src.y;
    const dx2 = p2_dst.x - p1_dst.x;
    const dy2 = p2_dst.y - p1_dst.y;

    const scale1 = Math.sqrt(dx1 * dx1 + dy1 * dy1); //img 2
    const scale2 = Math.sqrt(dx2 * dx2 + dy2 * dy2); //img 1
    const scale = scale1 > 0 ? scale2 / scale1 : 1;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    const rotation = angle2 - angle1; // difference dictates rotation

    const cos_r = Math.cos(rotation);
    const sin_r = Math.sin(rotation);

    // Calculate translation
    const tx = p1_dst.x - scale * (cos_r * p1_src.x - sin_r * p1_src.y);
    const ty = p1_dst.y - scale * (sin_r * p1_src.x + cos_r * p1_src.y);

    return {
      a: scale * cos_r,
      b: scale * sin_r,
      c: -scale * sin_r, // negative for correct orientation [a c e]
      d: scale * cos_r,
      e: tx,
      f: ty,
    };
  }
  //else {
  // More than 2 points - use least squares
  //}
  //return calculateTransformation();
}

function copyCanvasContent(sourceId, targetId) {
  const source = document.getElementById(sourceId);
  const target = document.getElementById(targetId);
  const targetCtx = target.getContext("2d");

  target.width = source.width;
  target.height = source.height;
  targetCtx.drawImage(source, 0, 0);
}

function resetApplication() {
  if (confirm("Ali ste prepričani, da želite ponastaviti celoten postopek?")) {
    // Reset all data
    images = [null, null];
    tiePoints = [[], []];
    controlPoints = [];
    mergedImageData = null;
    currentControlPoint = null;
    geoTransform = null;

    // Clear all canvases
    [
      "canvas1",
      "canvas2",
      "mergedCanvas",
      "mergedCanvas3",
      "mergedCanvas4",
    ].forEach((id) => {
      const canvas = document.getElementById(id);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Reset file inputs
    document.getElementById("image1Input").value = "";
    document.getElementById("image2Input").value = "";

    // Clear point lists
    document.getElementById("points1").innerHTML = "";
    document.getElementById("points2").innerHTML = "";
    document.getElementById("controlPoints").innerHTML = "";

    // Reset buttons
    document.getElementById("proceedStep2").disabled = true;
    document.getElementById("proceedStep3").disabled = true;
    document.getElementById("proceedStep4").disabled = true;

    // Hide control point form
    hideControlPointForm();

    // Go back to step 1
    showStep(1);

    // Remove any status messages
    document.querySelectorAll(".status-info").forEach((el) => el.remove());
  }
}

// Initialize application
window.onload = function () {
  // Set up default canvas sizes
  ["canvas1", "canvas2"].forEach((id) => {
    const canvas = document.getElementById(id);
    canvas.width = 500;
    canvas.height = 400;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#7f8c8d";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Naložite sliko", canvas.width / 2, canvas.height / 2);
  });

  // Set up merged canvas
  const mergedCanvas = document.getElementById("mergedCanvas");
  mergedCanvas.width = 800;
  mergedCanvas.height = 600;

  const mergedCtx = mergedCanvas.getContext("2d");
  mergedCtx.fillStyle = "#ecf0f1";
  mergedCtx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);
  mergedCtx.fillStyle = "#7f8c8d";
  mergedCtx.font = "18px Arial";
  mergedCtx.textAlign = "center";
  mergedCtx.fillText(
    "Združena slika se bo prikazala tukaj",
    mergedCanvas.width / 2,
    mergedCanvas.height / 2
  );

  // Copy merged canvas to other steps
  ["mergedCanvas3", "mergedCanvas4"].forEach((id) => {
    const canvas = document.getElementById(id);
    canvas.width = 800;
    canvas.height = 600;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#7f8c8d";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Združena slika se bo prikazala tukaj",
      canvas.width / 2,
      canvas.height / 2
    );
  });
};

// Handle keyboard shortcuts
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && currentControlPoint) {
    cancelControlPoint();
  }

  if (event.key === "Enter" && currentControlPoint) {
    event.preventDefault();
    saveControlPoint();
  }
});
