# Ortofoto Generator

This project is a web-based application designed to assist in generating orthophotos from overlapping aerial photographs. It guides users through a multi-step workflow: marking tie points, merging images, defining ground control points, and performing georeferencing.

---

## 🚀 Features

The application is structured into four main steps:

### 1. Vezne točke (Tie Points)
- **Image Upload**: Upload two overlapping aerial images.
- **Interactive Point Selection**: Click on both images to mark matching tie points.
- **Point Management**: View, delete, or clear all selected points.
- **Validation**: Ensures a minimum of 2 equally numbered points on both images before continuing.

### 2. Združitev slik (Image Merging)
- **Automatic Merging**: Merges the two uploaded images based on tie points.
- **Affine Transformation**: Calculates and applies a transformation using the tie points.
- **Visual Feedback**: Shows the merged result and tie point overlay.

### 3. Oslonilne točke (Ground Control Points)
- **Interactive Selection**: Click the merged image to define ground control points.
- **Coordinate Input**: Input real-world X and Y coordinates for each point.
- **Point Management**: View and clear all control points.

### 4. Georeferenciranje (Georeferencing)
- **Transformation Placeholder**: Intended to calculate the final georeferencing based on control points (currently a placeholder).
- **Reset Functionality**: Button to restart the process from Step 1.

---

## 🧰 Technologies Used

- **HTML5** – Structure and layout.
- **CSS3** (`style.css`) – Styling with gradients, shadows, responsive design.
- **JavaScript** (`script.js`) – All interactive logic including image handling, canvas drawing, transformations, and step navigation.

---

## 📁 Project Structure

```
.
├── index.html       # Application layout and UI
├── style.css        # All styling rules
└── script.js        # Interactive logic and processing
```

---

## 🧪 Running the Application

1. **Clone or Download** the repository to your local machine.
2. **Open `index.html`** in your web browser.
   - No server setup required. All processing is client-side.

---

## 📝 Usage Guide

### Step 1: Vezne točke (Tie Points)
- Click **"Choose File"** under "Slika 1" and "Slika 2" to upload your aerial images.
- Click matching points on each image to create tie points.
- Click **"Počisti točke"** (Clear Points) to reset.
- Once enough points are marked (at least 2 on each image, equally), the **"Nadaljuj → Korak 2"** button becomes active.

### Step 2: Združitev slik (Image Merging)
- Click **"Združi sliki"** (Merge Images) to combine images using affine transformation.
- The merged result is displayed.
- Proceed using the **"Nadaljuj → Korak 3"** button.

### Step 3: Oslonilne točke (Ground Control Points)
- Click on the merged image to mark a control point.
- Input the corresponding real-world **X** and **Y** coordinates (in meters).
- Click **"Shrani točko"** (Save Point) to store or **"Prekliči"** (Cancel) to discard.
- After saving enough control points, use the **"Nadaljuj → Korak 4"** button.

### Step 4: Georeferenciranje (Georeferencing)
- Currently, the `calculateGeoTransform()` function is a **placeholder**.
- Click **"Ponovi postopek"** (Repeat Process) to restart.

---

## ⚠️ Limitations

- **Client-Side Only**: No backend or persistent storage. All operations run in-browser.
- **Basic Transformation**: Uses a simple affine transform based on two tie points. For accurate georeferencing, more advanced models and points are needed.
- **No Real Output**: No generation of actual georeferenced images (e.g., GeoTIFF). Transformation logic is yet to be implemented.
- **Error Handling**: Basic validation exists; could be expanded for a more robust experience.
- **UI**: Functional but could benefit from improved feedback, point editing, and message clarity.
