// Constants for DOM elements
const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const statusDiv = document.getElementById("status");
const colorPreview = document.getElementById("color-preview");
const colorPalette = document.getElementById("colorPalette");
const nativeColorPicker = document.getElementById("nativeColorPicker");
const fileLoader = document.getElementById("fileLoader");
const refImageLoader = document.getElementById("refImageLoader"); // Get the reference image loader
const loadRefImageButton = document.getElementById("loadRefImageButton"); // Get the reference image button
const resizeModalBackdrop = document.getElementById("resizeModalBackdrop");
const resizeModal = document.getElementById("resizeModal");
const resizeInput = document.getElementById("resizeInput");
const resizeOkButton = document.getElementById("resizeOkButton");
const resizeCancelButton = document.getElementById("resizeCancelButton");
const resizeErrorDiv = document.getElementById("resizeError");
const exportModalBackdrop = document.getElementById("exportModalBackdrop");
const exportModal = document.getElementById("exportModal");
const exportInput = document.getElementById("exportInput");
const exportOkButton = document.getElementById("exportOkButton");
const exportCancelButton = document.getElementById("exportCancelButton");
const exportErrorDiv = document.getElementById("exportError");
const animExportModalBackdrop = document.getElementById(
  "animExportModalBackdrop"
);
const animExportModal = document.getElementById("animExportModal");
const animExportFormat = document.getElementById("animExportFormat");
const animExportScale = document.getElementById("animExportScale");
const animExportDelay = document.getElementById("animExportDelay");
const animExportLoop = document.getElementById("animExportLoop");
const animExportGrid = document.getElementById("animExportGrid");
const animExportStartButton = document.getElementById("animExportStartButton");
const animExportCancelButton = document.getElementById(
  "animExportCancelButton"
);
const animExportStatus = document.getElementById("animExportStatus");
const animExportError = document.getElementById("animExportError");
const layersPanel = document.getElementById("layersPanel");
const layerList = document.getElementById("layerList");
const addLayerButton = document.getElementById("addLayerButton");
// const onionSkinToggle = document.getElementById('onionSkinToggle'); // Removed global toggle
const timelinePanel = document.getElementById("timelinePanel");
const frameList = document.getElementById("frameList");
const addFrameButton = document.getElementById("addFrameButton");
const duplicateFrameButton = document.getElementById("duplicateFrameButton");
const toolGrid = document.getElementById("toolGrid");
const confirmModalBackdrop = document.getElementById("confirmModalBackdrop");
const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmOkButton = document.getElementById("confirmOkButton");
const confirmCancelButton = document.getElementById("confirmCancelButton");

// --- Configuration ---
let pixelSize = 20;
let gridWidth = 32;
let gridHeight = 32;
const gridColor = "#e0e0e0";
const exportGridColor = "#cccccc";
let drawColor = "#000000";
const eraseColor = null;
const longPressDuration = 500;
const selectionOutlineColor = "rgba(0, 150, 255, 0.7)";
const selectionDash = [4, 2];
const MAX_EXPORT_SCALE = 100;
const DEFAULT_EXPORT_SCALE = 10;
const DEFAULT_FRAME_DELAY = 100;
const DEFAULT_LOOP_COUNT = 0;
// const ONION_SKIN_PREV_FRAMES = 1; // Removed
// const ONION_SKIN_NEXT_FRAMES = 1; // Removed
const ONION_SKIN_BASE_ALPHA = 0.35; // Base opacity for closest onion frame (slightly increased)
const ONION_SKIN_MAX_DISTANCE = 5; // Max distance to show onion frames
const REFERENCE_LAYER_OPACITY = 0.5; // Opacity for the reference image layer
const REFERENCE_LAYER_SCALE_STEP = 0.1; // Step for resizing reference layer

// --- State ---
let currentTool = "draw";
let currentState = "idle"; // Possible states: 'idle', 'drawingLine', 'drawingRectangle', 'selecting', 'movingSelection', 'pasting', 'draggingReference'
let isModalOpen = false;
let isDrawing = false;
let startPos = null; // For drawing/selection start grid position
let currentPos = null; // For drawing/selection current grid position
let lastMousePos = { x: 0, y: 0 }; // For general mouse tracking and palette positioning
let longPressTimer = null;
let swatchBeingEdited = null;
let paletteJustClosed = false;
let isExportingAnimation = false;
// let onionSkinEnabled = false; // Removed global state
let confirmCallback = null;

// --- Selection & Clipboard State ---
let selectionRect = null;
let originalMoveRect = null;
let selectionContentData = null;
let selectionOffset = { x: 0, y: 0 };

// --- Reference Layer State ---
let refDragStartOffset = { x: 0, y: 0 }; // Offset of the mouse within the reference image when dragging starts

// --- Animation State ---
let animationData = [];
let activeFrameIndex = 0;
let activeLayerIndex = 0; // This index now refers to the *actual* index in the layers array
let nextFrameId = 1;
let nextLayerId = 1;
let draggedLayerId = null;
let draggedFrameIndex = null;

// --- Default Palette Colors ---
let paletteColors = [
  "#ffffff",
  "#f0f0f0",
  "#d0d0d0",
  "#b0b0b0",
  "#909090",
  "#707070",
  "#505050",
  "#000000",
  "#ff0000",
  "#ff8000",
  "#ffff00",
  "#80ff00",
  "#00ff00",
  "#00ff80",
  "#00ffff",
  "#0080ff",
  "#0000ff",
  "#8000ff",
  "#ff00ff",
  "#ff0080",
  "#ffaaaa",
  "#ffd4aa",
  "#ffffaa",
  "#d4ffaa",
  "#aaffaa",
  "#aaffd4",
  "#aaffff",
  "#aad4ff",
  "#aaaaff",
  "#d4aaff",
  "#ffaaff",
  "#ffaad4",
  "#d40000",
  "#d46a00",
  "#d4d400",
  "#6ad400",
  "#00d400",
  "#006a35",
  "#006a6a",
  "#00356a",
  "#00006a",
  "#35006a",
  "#6a006a",
  "#6a0035",
]; // Adjusted palette slightly

// --- Initialization and Setup ---
function createFrameObject(layers = []) {
  return {
    id: nextFrameId++,
    layers: layers,
    onionSkinEnabled: false, // Add onion skin property
  };
}
function initializeAnimation() {
  animationData = [];
  nextFrameId = 1;
  nextLayerId = 1;
  // Start with one pixel layer
  const firstLayer = createLayerObject("Layer 1", "pixel", true);
  const firstFrame = createFrameObject([firstLayer]); // Use createFrameObject
  animationData.push(firstFrame);
  activeFrameIndex = 0;
  activeLayerIndex = 0; // Active layer index is the index in the *actual* layers array
  console.log("Initialized animation with first frame and pixel layer.");
}
// Added layerType parameter
function createPixelData(width, height) {
  return Array(height)
    .fill(null)
    .map(() => Array(width).fill(eraseColor));
}
// Added offsetX, offsetY, scale for reference layers
function createLayerObject(
  name,
  type = "pixel",
  isVisible = true,
  data = null
) {
  const layer = {
    id: nextLayerId++,
    name: name || `${type === "pixel" ? "Layer" : "Ref"} ${nextLayerId - 1}`,
    type: type, // 'pixel' or 'reference'
    isVisible: isVisible,
  };
  if (type === "pixel") {
    layer.pixels = data || createPixelData(gridWidth, gridHeight);
  } else if (type === "reference") {
    layer.imageDataUrl = data ? data.imageDataUrl : null; // Store image data URL
    layer.originalWidth = data ? data.originalWidth : 0;
    layer.originalHeight = data ? data.originalHeight : 0;
    layer.offsetX = data ? data.offsetX : 0; // Position offset in pixels
    layer.offsetY = data ? data.offsetY : 0; // Position offset in pixels
    layer.scale = data ? data.scale : 1.0; // Scale factor
  }
  return layer;
}

// Add a new pixel layer to all frames
function addEmptyPixelLayerToAllFrames() {
  const newLayerName = `Layer ${nextLayerId}`; // Use Layer for pixel layers
  const newLayerGlobalId = nextLayerId++;
  const insertIndex = activeLayerIndex + 1; // Insert above the current active layer

  animationData.forEach((frame) => {
    const newLayer = {
      id: newLayerGlobalId,
      name: newLayerName,
      type: "pixel",
      pixels: createPixelData(gridWidth, gridHeight),
      isVisible: true,
    };
    // Find the correct insertion index based on layer IDs
    let actualInsertIndex = frame.layers.length; // Default to adding at the end
    if (activeLayerIndex >= 0 && activeLayerIndex < frame.layers.length) {
      // Find the layer ID below which the new layer should be inserted
      const belowLayerId = frame.layers[activeLayerIndex].id;
      actualInsertIndex =
        frame.layers.findIndex((layer) => layer.id === belowLayerId) + 1;
      // Ensure we don't insert before a reference layer if inserting at the very bottom
      if (actualInsertIndex === 0 && frame.layers[0].type === "reference") {
        actualInsertIndex = 1;
      }
    } else if (
      frame.layers.length > 0 &&
      frame.layers[0].type === "reference"
    ) {
      // If inserting at the very bottom and there's a ref layer, insert above it
      actualInsertIndex = 1;
    }

    frame.layers.splice(actualInsertIndex, 0, newLayer);
  });

  // Update active layer index based on the new layer's position in the active frame
  activeLayerIndex = animationData[activeFrameIndex].layers.findIndex(
    (layer) => layer.id === newLayerGlobalId
  );

  console.log(
    `Added pixel layer ${newLayerName} (ID: ${newLayerGlobalId}) to all frames at display index ${insertIndex}.`
  );
  renderLayersPanel();
  render();
}

// Add a reference layer to all frames
function addReferenceLayerToAllFrames(
  imageDataUrl,
  originalWidth,
  originalHeight
) {
  // Check if a reference layer already exists
  if (animationData[0].layers.some((layer) => layer.type === "reference")) {
    alert("Only one reference image layer is allowed.");
    return;
  }

  const newLayerName = `Reference`; // Fixed name for reference layer
  const newLayerGlobalId = nextLayerId++; // Still give it a unique ID

  animationData.forEach((frame) => {
    const newLayer = {
      id: newLayerGlobalId,
      name: newLayerName,
      type: "reference",
      isVisible: true, // Reference layer is visible by default
      imageDataUrl: imageDataUrl,
      originalWidth: originalWidth,
      originalHeight: originalHeight,
      offsetX: 0, // Initialize position
      offsetY: 0, // Initialize position
      scale: 1.0, // Initialize scale
    };
    // Reference layer is always the bottom layer (index 0)
    frame.layers.unshift(newLayer);
  });

  // Update active layer index if necessary (if the previously active layer was shifted)
  // Set the newly added reference layer as the active layer
  activeLayerIndex = 0;

  console.log(`Added reference layer (ID: ${newLayerGlobalId}) to all frames.`);
  renderLayersPanel();
  render();
}

function setupCanvas() {
  canvas.width = gridWidth * pixelSize;
  canvas.height = gridHeight * pixelSize;
  ctx.imageSmoothingEnabled = false;
  setCanvasCursor();
  updateStatus();
}
function initializeEditor() {
  initializeAnimation();
  setupCanvas();
  generatePalette();
  addModalListeners();
  addLayerPanelListeners();
  addTimelineListeners();
  addToolGridListeners();
  addGlobalMouseListeners();
  addReferenceImageLoaderListener();
  addCanvasMouseListeners();
  addCanvasWheelListener();
  /* Removed addOnionSkinListener(); */ renderTimelinePanel();
  renderLayersPanel();
  render();
  updateStatus();
} // Removed global onion skin listener, added canvas listeners

// --- Palette Functions ---
function generatePalette() {
  colorPalette.innerHTML = "";
  paletteColors.forEach((color, index) => {
    const swatch = document.createElement("div");
    swatch.classList.add("color-swatch");
    swatch.style.backgroundColor = color;
    swatch.dataset.colorIndex = index;
    swatch.addEventListener("mousedown", (e) => {
      e.preventDefault();
      swatchBeingEdited = swatch;
      clearTimeout(longPressTimer);
      setTimeout(() => {
        nativeColorPicker.style.left = `${lastMousePos.x}px`;
        nativeColorPicker.style.top = `${lastMousePos.y}px`;
      }, 2)
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        
        nativeColorPicker.value = paletteColors[index];
        nativeColorPicker.click();
      }, longPressDuration);
    });
    swatch.addEventListener("mouseup", (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        drawColor = paletteColors[index];
        updateStatus();
        hidePalette();
      }
    });
    const cancelLongPress = () => {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    };
    swatch.addEventListener("mousemove", cancelLongPress);
    swatch.addEventListener("mouseleave", cancelLongPress);
    swatch.addEventListener("contextmenu", (e) => e.preventDefault());
    colorPalette.appendChild(swatch);
  });
}
nativeColorPicker.addEventListener("input", (e) => {
  if (swatchBeingEdited) {
    const newColor = e.target.value;
    const index = parseInt(swatchBeingEdited.dataset.colorIndex, 10);
    paletteColors[index] = newColor;
    swatchBeingEdited.style.backgroundColor = newColor;
    // Update the current drawing color if the edited swatch was the current draw color
    // This check was the issue. We should just update the drawColor.
    // if (swatchBeingEdited.style.backgroundColor === colorPreview.style.backgroundColor) {
    drawColor = newColor; // Directly update the drawColor
    colorPreview.style.backgroundColor = drawColor; // Update the preview
    updateStatus(); // Update the status display
    // }
    //swatchBeingEdited = null;
  }
});
function showPalette() {
  if (isModalOpen) return;
  const paletteRect = colorPalette.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  let top = lastMousePos.y + 10;
  let left = lastMousePos.x + 10;
  if (top + paletteRect.height > bodyRect.height)
    top = lastMousePos.y - paletteRect.height - 10;
  if (left + paletteRect.width > bodyRect.width)
    left = lastMousePos.x - paletteRect.width - 10;
  if (top < 0) top = 5;
  if (left < 0) left = 5;
  colorPalette.style.top = `${top}px`;
  colorPalette.style.left = `${left}px`;
  colorPalette.style.display = "grid";
  setTimeout(() => {
    document.addEventListener("click", handleClickOutsidePalette, {
      capture: true,
      once: true,
    });
  }, 0);
}
function hidePalette() {
  if (colorPalette.style.display === "none") return;
  colorPalette.style.display = "none";
  document.removeEventListener("click", handleClickOutsidePalette, {
    capture: true,
  });
  clearTimeout(longPressTimer);
  longPressTimer = null;
  paletteJustClosed = true;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      paletteJustClosed = false;
    });
  });
}
function handleClickOutsidePalette(event) {
  if (
    !colorPalette.contains(event.target) &&
    event.target !== nativeColorPicker
  ) {
    hidePalette();
  } else {
    document.addEventListener("click", handleClickOutsidePalette, {
      capture: true,
      once: true,
    });
  }
}

// --- Enhanced Drawing & Rendering ---
function render() {
  if (activeFrameIndex < 0 || activeFrameIndex >= animationData.length) {
    console.error(
      "Render cancelled: Invalid active frame index",
      activeFrameIndex
    );
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Get layers for the current frame
  const currentFrame = animationData[activeFrameIndex];
  const layersToDraw = [...currentFrame.layers]; // Create a copy to avoid modifying the original array during iteration

  // Sort layers for rendering: reference layer(s) at the bottom, then pixel layers
  layersToDraw.sort((a, b) => {
    if (a.type === "reference" && b.type !== "reference") return -1; // Reference layer comes first (bottom)
    if (a.type !== "reference" && b.type === "reference") return 1; // Pixel layer comes after reference
    // Maintain original order for layers of the same type (though pixel layers are reversed in panel)
    // For rendering, we draw in array order (bottom up)
    return 0; // Keep original order for same types
  });

  // 1. Draw Onion Skins (per-frame enabled) - *** NEW LOGIC ***
  // Onion skins should probably only show pixel data from other frames
  animationData.forEach((frame, index) => {
    if (index !== activeFrameIndex && frame.onionSkinEnabled) {
      const distance = Math.abs(index - activeFrameIndex);
      if (distance > 0 && distance <= ONION_SKIN_MAX_DISTANCE) {
        // Decrease opacity based on distance (1/distance relationship)
        const alpha = ONION_SKIN_BASE_ALPHA / distance;
        // Draw only pixel layers from the onion skin frame
        frame.layers.forEach((layer) => {
          if (layer.isVisible && layer.type === "pixel") {
            drawPixelData(layer.pixels, 0, 0, gridWidth, gridHeight, alpha);
          }
        });
      }
    }
  });

  // 2. Draw layers for the active frame (sorted order)
  layersToDraw.forEach((layer) => {
    if (layer.isVisible) {
      if (layer.type === "pixel") {
        drawPixelData(layer.pixels, 0, 0, gridWidth, gridHeight);
      } else if (layer.type === "reference" && layer.imageDataUrl) {
        drawReferenceImage(layer);
      }
    }
  });

  // 3. Draw moving/pasting content (always on top of regular layers)
  // This should only apply to pixel data
  if (
    (currentState === "movingSelection" || currentState === "pasting") &&
    selectionContentData
  ) {
    drawPixelData(
      selectionContentData.pixels,
      selectionOffset.x,
      selectionOffset.y,
      selectionContentData.width,
      selectionContentData.height,
      0.8
    );
    drawSelectionOutline(
      selectionOffset.x * pixelSize,
      selectionOffset.y * pixelSize,
      selectionContentData.width * pixelSize,
      selectionContentData.height * pixelSize,
      true
    );
  }

  // 4. Draw selection outline (always on top)
  if (currentState === "selecting" && startPos && currentPos) {
    const rect = getNormalizedRect(startPos, currentPos);
    drawSelectionOutline(
      rect.x * pixelSize,
      rect.y * pixelSize,
      rect.width * pixelSize,
      rect.height * pixelSize,
      true
    );
  } else if (currentState === "idle" && selectionRect) {
    drawSelectionOutline(
      selectionRect.x * pixelSize,
      selectionRect.y * pixelSize,
      selectionRect.width * pixelSize,
      selectionRect.height * pixelSize,
      true
    );
  }

  // 5. Draw line/rectangle preview (always on top)
  if (currentState === "drawingLine" && startPos && currentPos) {
    drawLinePreview(
      startPos.gridX,
      startPos.gridY,
      currentPos.gridX,
      currentPos.gridY
    );
  } else if (currentState === "drawingRectangle" && startPos && currentPos) {
    drawRectanglePreview(
      startPos.gridX,
      startPos.gridY,
      currentPos.gridX,
      currentPos.gridY
    );
  }

  // 6. Draw grid (always on top)
  drawGrid();
}

// Helper to draw pixel data onto the canvas context
function drawPixelData(data, offsetX, offsetY, width, height, alpha = 1) {
  ctx.globalAlpha = alpha;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < data.length && x < data[y].length) {
        const color = data[y][x];
        if (color !== eraseColor) {
          const drawX = offsetX + x;
          const drawY = offsetY + y;
          if (
            drawX >= 0 &&
            drawX < gridWidth &&
            drawY >= 0 &&
            drawY < gridHeight
          ) {
            ctx.fillStyle = color;
            ctx.fillRect(
              drawX * pixelSize,
              drawY * pixelSize,
              pixelSize,
              pixelSize
            );
          }
        }
      }
    }
  }
  ctx.globalAlpha = 1; // Reset alpha
}

// Helper to draw the reference image layer
function drawReferenceImage(layer) {
  if (!layer.imageDataUrl) return;

  // Create an Image object if it doesn't exist or data URL has changed
  if (!layer._image || layer._image.src !== layer.imageDataUrl) {
    layer._image = new Image();
    layer._image.onload = () => {
      // Once loaded, re-render the canvas to show the image
      render();
    };
    layer._image.onerror = (e) => {
      console.error("Error loading reference image:", e);
      // Optionally remove the layer or show an error to the user
    };
    layer._image.src = layer.imageDataUrl;
  }

  // Draw the image if it's loaded
  if (layer._image.complete && layer._image.naturalWidth > 0) {
    ctx.globalAlpha = REFERENCE_LAYER_OPACITY; // Use defined opacity

    const scaledWidth = layer._image.naturalWidth * layer.scale;
    const scaledHeight = layer._image.naturalHeight * layer.scale;

    // Draw the image at its offset and scaled size
    ctx.drawImage(
      layer._image,
      layer.offsetX,
      layer.offsetY,
      scaledWidth,
      scaledHeight
    );

    ctx.globalAlpha = 1; // Reset alpha
  }
}

function drawGrid() {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= gridWidth; x++) {
    ctx.beginPath();
    ctx.moveTo(x * pixelSize, 0);
    ctx.lineTo(x * pixelSize, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= gridHeight; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * pixelSize);
    ctx.lineTo(canvas.width, y * pixelSize);
    ctx.stroke();
  }
}
function drawSelectionOutline(x, y, w, h, dashed = true) {
  ctx.strokeStyle = selectionOutlineColor;
  ctx.lineWidth = 1;
  if (dashed) {
    ctx.setLineDash(selectionDash);
  } else {
    ctx.setLineDash([]);
  }
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.setLineDash([]);
}
function drawLinePreview(x0, y0, x1, y1) {
  const points = plotLine(x0, y0, x1, y1);
  ctx.fillStyle = drawColor;
  ctx.globalAlpha = 0.5;
  points.forEach((p) => {
    if (p.x >= 0 && p.x < gridWidth && p.y >= 0 && p.y < gridHeight) {
      ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
    }
  });
  ctx.globalAlpha = 1.0;
}
function drawRectanglePreview(x0, y0, x1, y1) {
  const points = plotRectangle(x0, y0, x1, y1);
  ctx.fillStyle = drawColor;
  ctx.globalAlpha = 0.5;
  points.forEach((p) => {
    if (p.x >= 0 && p.x < gridWidth && p.y >= 0 && p.y < gridHeight) {
      ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
    }
  });
  ctx.globalAlpha = 1.0;
}

// --- Timeline Panel Rendering ---
function renderTimelinePanel() {
  frameList.innerHTML = "";
  animationData.forEach((frame, index) => {
    const frameItem = document.createElement("div");
    frameItem.classList.add("frame-item");
    frameItem.dataset.frameIndex = index;
    frameItem.draggable = true;

    // Onion Skin Toggle Button (First)
    const onionToggle = document.createElement("button");
    onionToggle.classList.add("onion-skin-toggle-btn");
    onionToggle.innerHTML = "🧅";
    onionToggle.title = "Toggle Onion Skin";
    onionToggle.classList.toggle("active", frame.onionSkinEnabled);
    onionToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFrameOnionSkin(index);
    });

    // Frame Number/Label (Second)
    const frameLabel = document.createElement("span");
    frameLabel.classList.add("frame-label");
    frameLabel.textContent = `F${index + 1}`;

    // Delete Button (Third)
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-button");
    deleteBtn.innerHTML = "&times;";
    deleteBtn.title = "Delete Frame";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleDeleteFrame(index);
    });

    // *** CHANGED ORDER OF APPENDING ***
    frameItem.appendChild(onionToggle); // Add onion toggle first
    frameItem.appendChild(frameLabel); // Add label second
    frameItem.appendChild(deleteBtn); // Add delete button last

    if (index === activeFrameIndex) {
      frameItem.classList.add("active");
    }

    // Click to select frame (only on the item itself or label)
    frameItem.addEventListener("click", (e) => {
      // Check if the click target is NOT one of the buttons
      if (!e.target.closest("button")) {
        setActiveFrame(index);
      }
    });

    // Frame Drag and Drop Listeners
    frameItem.addEventListener("dragstart", handleFrameDragStart);
    frameItem.addEventListener("dragover", handleFrameDragOver);
    frameItem.addEventListener("dragleave", handleFrameDragLeave);
    frameItem.addEventListener("drop", handleFrameDrop);
    frameItem.addEventListener("dragend", handleFrameDragEnd);

    frameList.appendChild(frameItem);
  });
  // Scroll active frame into view
  const activeFrameElement = frameList.querySelector(".frame-item.active");
  if (activeFrameElement) {
    activeFrameElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }
}

// --- Layers Panel Rendering ---
function renderLayersPanel() {
  if (activeFrameIndex < 0 || activeFrameIndex >= animationData.length) return;
  const currentFrameLayers = animationData[activeFrameIndex].layers;
  layerList.innerHTML = "";

  // Sort layers for display: pixel layers (reversed), then reference layer(s) at the bottom
  const layersToDisplay = [...currentFrameLayers].sort((a, b) => {
    if (a.type === "reference" && b.type !== "reference") return 1; // Reference layer comes last (bottom of panel)
    if (a.type !== "reference" && b.type === "reference") return -1; // Pixel layer comes before reference
    // For pixel layers, display in reverse of array order (top down)
    // The loop below iterates in reverse, so we don't need to sort pixel layers here
    return 0; // Keep original order for same types
  });

  // Iterate in reverse to display layers from top to bottom in the panel
  for (let i = layersToDisplay.length - 1; i >= 0; i--) {
    const layer = layersToDisplay[i];
    // Find the actual index in the animationData array
    const actualIndex = currentFrameLayers.findIndex((l) => l.id === layer.id);

    const layerItem = document.createElement("div");
    layerItem.classList.add("layer-item");
    layerItem.dataset.layerId = layer.id;
    layerItem.dataset.actualIndex = actualIndex; // Store actual index for easy lookup

    // Add class for reference layer styling
    if (layer.type === "reference") {
      layerItem.classList.add("reference-layer");
      layerItem.draggable = false; // Reference layers are not draggable in the panel
    } else {
      layerItem.draggable = true; // Pixel layers are draggable
    }

    if (actualIndex === activeLayerIndex) {
      layerItem.classList.add("active");
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-button");
    deleteBtn.innerHTML = "&times;";
    deleteBtn.title = "Delete Layer";
    // Only add delete listener for pixel layers
    if (layer.type === "pixel") {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteLayer(layer.id, layer.name);
      });
    } else {
      // For reference layer, the delete action is handled separately
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteReferenceLayer();
      });
      deleteBtn.title = "Delete Reference Layer"; // Update tooltip
    }

    const layerName = document.createElement("span");
    layerName.textContent = layer.name;

    const visibilityToggle = document.createElement("i");
    visibilityToggle.classList.add(
      "visibility-toggle",
      "fas",
      layer.isVisible ? "fa-eye" : "fa-eye-slash"
    );
    visibilityToggle.classList.toggle("visible", layer.isVisible);
    visibilityToggle.classList.toggle("hidden", !layer.isVisible);
    visibilityToggle.title = layer.isVisible ? "Hide Layer" : "Show Layer";
    // Add visibility listener for all layer types
    visibilityToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLayerVisibility(layer.id);
    });

    // Click to select layer
    layerItem.addEventListener("click", (e) => {
      // Check if the click target is NOT one of the buttons
      if (!e.target.closest("button")) {
        setActiveLayer(actualIndex); // Set active using the actual index
      }
    });

    // Drag and Drop listeners only for pixel layers
    if (layer.type === "pixel") {
      layerItem.addEventListener("dragstart", handleLayerDragStart);
      layerItem.addEventListener("dragover", handleLayerDragOver);
      layerItem.addEventListener("dragleave", handleLayerDragLeave);
      layerItem.addEventListener("drop", handleLayerDrop);
      layerItem.addEventListener("dragend", handleLayerDragEnd);
    }

    layerItem.appendChild(deleteBtn);
    layerItem.appendChild(layerName);
    layerItem.appendChild(visibilityToggle);
    layerList.appendChild(layerItem);
  }
}

// --- Tool & State Logic ---
// Returns pixel data for the active layer IF it's a pixel layer
function getActiveLayerData() {
  if (activeFrameIndex < 0 || activeFrameIndex >= animationData.length)
    return null;
  const currentFrame = animationData[activeFrameIndex];
  const activeLayer = currentFrame.layers[activeLayerIndex];
  // Ensure activeLayerIndex points to a pixel layer before returning data
  if (activeLayer && activeLayer.type === "pixel") {
    return activeLayer.pixels;
  }
  // If the active layer is not a pixel layer (e.g., reference layer), return null
  // console.warn("Attempted to get pixel data from non-pixel or invalid active layer:", activeLayerIndex, "for frame", activeFrameIndex);
  return null;
}

// Returns the active layer object regardless of type
function getActiveLayer() {
  if (activeFrameIndex < 0 || activeFrameIndex >= animationData.length)
    return null;
  const currentFrame = animationData[activeFrameIndex];
  if (activeLayerIndex >= 0 && activeLayerIndex < currentFrame.layers.length) {
    return currentFrame.layers[activeLayerIndex];
  }
  console.error(
    "Invalid active layer index:",
    activeLayerIndex,
    "for frame",
    activeFrameIndex
  );
  return null;
}

function applyTool(gridX, gridY) {
  const activeData = getActiveLayerData();
  if (!activeData) return; // Cannot draw on non-pixel layers

  if (gridX < 0 || gridX >= gridWidth || gridY < 0 || gridY >= gridHeight)
    return;

  let changed = false;
  switch (currentTool) {
    case "draw":
      if (activeData[gridY][gridX] !== drawColor) {
        activeData[gridY][gridX] = drawColor;
        changed = true;
      }
      break;
    case "erase":
      if (activeData[gridY][gridX] !== eraseColor) {
        activeData[gridY][gridX] = eraseColor;
        changed = true;
      }
      break;
    // Fill tool handled separately in mousedown
  }
  if (changed) render();
}
function finalizeLine(x0, y0, x1, y1) {
  const activeData = getActiveLayerData();
  if (!activeData) return; // Cannot draw on non-pixel layers

  const points = plotLine(x0, y0, x1, y1);
  let changed = false;
  points.forEach((p) => {
    if (p.x >= 0 && p.x < gridWidth && p.y >= 0 && p.y < gridHeight) {
      if (activeData[p.y][p.x] !== drawColor) {
        activeData[p.y][p.x] = drawColor;
        changed = true;
      }
    }
  });
  if (changed) render();
}
function finalizeRectangle(x0, y0, x1, y1) {
  const activeData = getActiveLayerData();
  if (!activeData) return; // Cannot draw on non-pixel layers

  const points = plotRectangle(x0, y0, x1, y1);
  let changed = false;
  points.forEach((p) => {
    if (p.x >= 0 && p.x < gridWidth && p.y >= 0 && p.y < gridHeight) {
      if (activeData[p.y][p.x] !== drawColor) {
        activeData[p.y][p.x] = drawColor;
        changed = true;
      }
    }
  });
  if (changed) render();
}
function floodFill(startX, startY, fillColor) {
  const layerData = getActiveLayerData();
  if (!layerData) return; // Cannot fill non-pixel layers

  if (startX < 0 || startX >= gridWidth || startY < 0 || startY >= gridHeight) {
    return;
  }

  const targetColor = layerData[startY][startX];
  if (targetColor === fillColor) {
    return;
  }

  const queue = [[startX, startY]];
  const visited = new Set();
  visited.add(`${startX},${startY}`);
  let iterations = 0;
  const maxIterations = gridWidth * gridHeight * 2; // Prevent infinite loops

  while (queue.length > 0) {
    iterations++;
    if (iterations > maxIterations) {
      console.error("Flood fill limit reached.");
      break;
    }

    const [x, y] = queue.shift();

    // Ensure coordinates are within bounds before accessing layerData
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;

    if (layerData[y][x] === targetColor) {
      layerData[y][x] = fillColor;

      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];

      for (const [nx, ny] of neighbors) {
        const key = `${nx},${ny}`;
        // Check bounds and visited set before adding to queue
        if (
          nx >= 0 &&
          nx < gridWidth &&
          ny >= 0 &&
          ny < gridHeight &&
          !visited.has(key)
        ) {
          visited.add(key);
          // Only add neighbors with the target color to the queue
          if (layerData[ny][nx] === targetColor) {
            queue.push([nx, ny]);
          }
        }
      }
    }
  }
  render();
}

function plotRectangle(x0, y0, x1, y1) {
  const points = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  for (let x = minX; x <= maxX; x++) {
    points.push({ x: x, y: minY });
    if (minY !== maxY) {
      points.push({ x: x, y: maxY });
    }
  }
  for (let y = minY + 1; y < maxY; y++) {
    points.push({ x: minX, y: y });
    if (minX !== maxX) {
      points.push({ x: maxX, y: y });
    }
  }
  return points;
}
function plotLine(x0, y0, x1, y1) {
  const points = [];
  const dx = Math.abs(x1 - x0),
    sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0),
    sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
  return points;
}
function getNormalizedRect(p1, p2) {
  const x = Math.min(p1.gridX, p2.gridX);
  const y = Math.min(p1.gridY, p2.gridY);
  const width = Math.abs(p1.gridX - p2.gridX) + 1;
  const height = Math.abs(p1.gridY - p2.gridY) + 1;
  return { x, y, width, height };
}
function setCanvasCursor() {
  const activeLayer = getActiveLayer();

  if (activeLayer && activeLayer.type === "reference") {
    canvas.style.cursor = "move"; // Move cursor for reference layer
  }
  // If a pixel layer is active, set cursor based on tool/state
  else if (activeLayer && activeLayer.type === "pixel") {
    if (currentState === "movingSelection" || currentState === "pasting") {
      canvas.style.cursor = "move";
    } else if (currentTool === "fill") {
      canvas.style.cursor = "crosshair";
    } else if (
      currentTool === "select" ||
      currentTool === "line" ||
      currentTool === "rectangle" ||
      currentTool === "draw" ||
      currentTool === "erase"
    ) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "default";
    }
  } else {
    canvas.style.cursor = "default"; // Default cursor if no layer or invalid layer is active
  }
}

// --- Selection Manipulation ---
function copySelectionData(rect) {
  const activeData = getActiveLayerData();
  if (!activeData || !rect) return null; // Can only copy from pixel layers

  const data = [];
  for (let y = 0; y < rect.height; y++) {
    const row = [];
    for (let x = 0; x < rect.width; x++) {
      const sourceX = rect.x + x;
      const sourceY = rect.y + y;
      if (
        sourceX >= 0 &&
        sourceX < gridWidth &&
        sourceY >= 0 &&
        sourceY < gridHeight
      ) {
        row.push(activeData[sourceY][sourceX]);
      } else {
        row.push(eraseColor); // Fill outside bounds with erase color
      }
    }
    data.push(row);
  }
  return { width: rect.width, height: rect.height, pixels: data };
}
function clearSelectionArea(rect) {
  const activeData = getActiveLayerData();
  if (!activeData || !rect) return false; // Can only clear pixel layers

  let changed = false;
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        if (activeData[y][x] !== eraseColor) {
          activeData[y][x] = eraseColor;
          changed = true;
        }
      }
    }
  }
  return changed;
}
function stampSelection(contentData, offset) {
  const activeData = getActiveLayerData();
  if (!activeData || !contentData) return false; // Can only stamp onto pixel layers

  let changed = false;
  for (let y = 0; y < contentData.height; y++) {
    for (let x = 0; x < contentData.width; x++) {
      const targetX = offset.x + x;
      const targetY = offset.y + y;
      if (
        targetX >= 0 &&
        targetX < gridWidth &&
        targetY >= 0 &&
        targetY < gridHeight
      ) {
        const color = contentData.pixels[y][x];
        if (color !== eraseColor) {
          if (activeData[targetY][targetX] !== color) {
            activeData[targetY][targetX] = color;
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}

// --- Layer & Frame Management ---
function setActiveFrame(index) {
  if (index >= 0 && index < animationData.length) {
    if (activeFrameIndex !== index) {
      cancelPlacement();
      console.log(`Setting active frame to index ${index}`);
      activeFrameIndex = index;
      // Ensure activeLayerIndex is valid for the new frame.
      // Try to keep the same layer ID active if it exists in the new frame.
      // Otherwise, default to the first pixel layer, or 0 if none exist.
      const currentActiveLayerId =
        animationData[activeFrameIndex].layers[activeLayerIndex]?.id;
      let newActiveLayerIndex = animationData[
        activeFrameIndex
      ].layers.findIndex((layer) => layer.id === currentActiveLayerId);

      // If the layer ID wasn't found or the found layer is not a pixel layer,
      // find the first pixel layer in the new frame.
      if (
        newActiveLayerIndex === -1 ||
        animationData[activeFrameIndex].layers[newActiveLayerIndex].type !==
          "pixel"
      ) {
        newActiveLayerIndex = animationData[activeFrameIndex].layers.findIndex(
          (layer) => layer.type === "pixel"
        );
        // If no pixel layers exist (shouldn't happen with current logic), default to 0
        if (newActiveLayerIndex === -1) newActiveLayerIndex = 0;
      }
      activeLayerIndex = newActiveLayerIndex;

      renderTimelinePanel();
      renderLayersPanel();
      render();
    }
  } else {
    console.error("Attempted to set invalid active frame index:", index);
  }
}

function setActiveLayer(index) {
  if (activeFrameIndex < 0 || activeFrameIndex >= animationData.length) return;
  const currentFrameLayers = animationData[activeFrameIndex].layers;
  if (index >= 0 && index < currentFrameLayers.length) {
    if (activeLayerIndex !== index) {
      cancelPlacement(); // Cancel any ongoing pixel placement
      console.log(
        `Setting active layer to index ${index} (ID: ${currentFrameLayers[index].id}, Type: ${currentFrameLayers[index].type})`
      );
      activeLayerIndex = index;
      renderLayersPanel();
      setCanvasCursor(); // Update cursor based on active layer type
      // No full render needed, only layers panel appearance changes and cursor
      updateStatus(); // Update status to show active layer name/type
    }
  } else {
    console.error("Attempted to set invalid active layer index:", index);
  }
}

function toggleLayerVisibility(layerId) {
  let changed = false;
  animationData.forEach((frame) => {
    const layer = frame.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.isVisible = !layer.isVisible;
      changed = true;
      console.log(
        `Layer ${layerId} visibility set to ${layer.isVisible} in frame ${frame.id}`
      );
    }
  });
  if (changed) {
    renderLayersPanel();
    render();
  }
}

// --- Layer Drag/Drop Handlers ---
function handleLayerDragStart(e) {
  // Only allow dragging pixel layers
  if (
    !e.target.classList.contains("layer-item") ||
    e.target.classList.contains("reference-layer")
  )
    return;

  draggedLayerId = parseInt(e.target.dataset.layerId, 10);
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", draggedLayerId);
  e.target.classList.add("dragging");
  console.log("Drag Start Pixel Layer ID:", draggedLayerId);
}
function handleLayerDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const targetElement = e.target.closest(".layer-item");

  // Only allow dropping onto other pixel layers or the layer list background
  if (targetElement && !targetElement.classList.contains("reference-layer")) {
    const droppedOnLayerId = parseInt(targetElement.dataset.layerId, 10);
    if (droppedOnLayerId !== draggedLayerId) {
      document
        .querySelectorAll("#layerList .layer-item.drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
      targetElement.classList.add("drag-over");
    }
  } else if (!targetElement && e.target.id === "layerList") {
    // Allow dropping onto the empty layer list area
    document
      .querySelectorAll("#layerList .layer-item.drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
    // No specific item to add class to, maybe add a class to the list itself if needed for visual feedback
  } else {
    // Prevent dropping on reference layers
    e.dataTransfer.dropEffect = "none";
  }
}
function handleLayerDragLeave(e) {
  const targetElement = e.target.closest(".layer-item");
  if (targetElement) {
    targetElement.classList.remove("drag-over");
  }
}
function handleLayerDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const targetElement = e.target.closest(".layer-item");
  const droppedOnLayerId = targetElement
    ? parseInt(targetElement.dataset.layerId, 10)
    : null;

  document
    .querySelectorAll("#layerList .layer-item.drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  const draggingElement = layerList.querySelector(".dragging");
  if (draggingElement) draggingElement.classList.remove("dragging");

  if (draggedLayerId === null || draggedLayerId === droppedOnLayerId) {
    draggedLayerId = null;
    return;
  }

  let finalActiveLayerId = getActiveLayer()?.id; // Get ID of the layer that was active before the drop

  animationData.forEach((frame) => {
    const currentLayers = frame.layers;
    const draggedIndex = currentLayers.findIndex(
      (layer) => layer.id === draggedLayerId
    );
    if (draggedIndex === -1) return; // Layer not found in this frame (shouldn't happen with current logic)

    const [draggedLayer] = currentLayers.splice(draggedIndex, 1);

    let targetIndex;
    if (droppedOnLayerId !== null) {
      targetIndex = currentLayers.findIndex(
        (layer) => layer.id === droppedOnLayerId
      );
      if (targetIndex === -1) {
        console.warn(
          `Dropped on layer ID ${droppedOnLayerId} not found in frame ${frame.id}. Appending layer.`
        );
        currentLayers.push(draggedLayer);
        return;
      }
      // Insert *after* the target layer in the array (which is visually *above* in the reversed list)
      targetIndex = targetIndex + 1;
      // Ensure we don't insert below a reference layer if the target was the bottom pixel layer
      if (
        targetIndex > 0 &&
        currentLayers[targetIndex - 1]?.type === "reference"
      ) {
        targetIndex = 1; // Insert above the reference layer
      }
    } else {
      // Dropped onto the empty list area - add to the top (end of the array)
      targetIndex = currentLayers.length;
    }

    // Ensure the targetIndex is not before a reference layer if one exists at index 0
    if (
      currentLayers.length > 0 &&
      currentLayers[0].type === "reference" &&
      targetIndex === 0
    ) {
      targetIndex = 1;
    }

    currentLayers.splice(targetIndex, 0, draggedLayer);
  });

  // Update active layer index based on the final position of the previously active layer
  activeLayerIndex = animationData[activeFrameIndex].layers.findIndex(
    (l) => l.id === finalActiveLayerId
  );
  if (activeLayerIndex === -1) {
    // If the previously active layer was the one being dragged, set the new active layer
    // to the one that is now at the target index (if it's a pixel layer),
    // or the first pixel layer if the target was empty or non-pixel.
    const targetLayer = animationData[activeFrameIndex].layers.find(
      (l) => l.id === draggedLayerId
    );
    if (targetLayer && targetLayer.type === "pixel") {
      activeLayerIndex =
        animationData[activeFrameIndex].layers.indexOf(targetLayer);
    } else {
      activeLayerIndex = animationData[activeFrameIndex].layers.findIndex(
        (layer) => layer.type === "pixel"
      );
      if (activeLayerIndex === -1) activeLayerIndex = 0; // Fallback
    }
  }

  console.log(`Moved pixel layer ${draggedLayerId} across all frames.`);
  draggedLayerId = null;
  renderLayersPanel();
  // No need to render canvas, only layer order changed visually in panel
}

function handleLayerDragEnd(e) {
  e.target.classList.remove("dragging");
  document
    .querySelectorAll("#layerList .layer-item.drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  draggedLayerId = null;
  console.log("Layer Drag End");
}
function addLayerPanelListeners() {
  addLayerButton.addEventListener("click", addEmptyPixelLayerToAllFrames); // Add pixel layer
  loadRefImageButton.addEventListener("click", () => {
    if (isModalOpen) return; // Prevent opening file dialog if modal is open
    // Trigger the hidden file input
    refImageLoader.click();
  });

  layerList.addEventListener("dragover", (e) => {
    e.preventDefault();
    // Allow dropping onto the list itself
    if (e.target.id === "layerList") {
      e.dataTransfer.dropEffect = "move";
    }
  });
  layerList.addEventListener("drop", handleLayerDrop);
}

// --- Frame Drag/Drop Handlers ---
function handleFrameDragStart(e) {
  if (!e.target.classList.contains("frame-item")) return;
  draggedFrameIndex = parseInt(e.target.dataset.frameIndex, 10);
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", draggedFrameIndex);
  e.target.classList.add("dragging");
  console.log("Drag Start Frame Index:", draggedFrameIndex);
}
function handleFrameDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const targetElement = e.target.closest(".frame-item");
  if (
    targetElement &&
    parseInt(targetElement.dataset.frameIndex, 10) !== draggedFrameIndex
  ) {
    document
      .querySelectorAll("#frameList .frame-item.drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
    targetElement.classList.add("drag-over");
  }
}
function handleFrameDragLeave(e) {
  const targetElement = e.target.closest(".frame-item");
  if (targetElement) {
    targetElement.classList.remove("drag-over");
  }
}
function handleFrameDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const targetElement = e.target.closest(".frame-item");
  const droppedOnFrameIndex = targetElement
    ? parseInt(targetElement.dataset.frameIndex, 10)
    : null;

  document
    .querySelectorAll("#frameList .frame-item.drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  const draggingElement = frameList.querySelector(".dragging");
  if (draggingElement) draggingElement.classList.remove("dragging");

  if (draggedFrameIndex === null || draggedFrameIndex === droppedOnFrameIndex) {
    draggedFrameIndex = null;
    return;
  }

  const [draggedFrame] = animationData.splice(draggedFrameIndex, 1);

  let targetIndex;
  if (droppedOnFrameIndex !== null) {
    // Adjust target index based on whether we are dragging forward or backward
    targetIndex =
      draggedFrameIndex < droppedOnFrameIndex
        ? droppedOnFrameIndex - 1
        : droppedOnFrameIndex;
  } else {
    // Dropped onto the empty list area - add to the end
    targetIndex = animationData.length;
  }

  animationData.splice(targetIndex, 0, draggedFrame);

  console.log(`Moved frame from index ${draggedFrameIndex} to ${targetIndex}`);

  // Set the active frame to the one that was just moved
  activeFrameIndex = animationData.findIndex(
    (frame) => frame.id === draggedFrame.id
  );
  if (activeFrameIndex === -1) activeFrameIndex = 0; // Fallback if something went wrong

  draggedFrameIndex = null;
  renderTimelinePanel();
  renderLayersPanel(); // Re-render layers panel as the active frame changed
  render();
}
function handleFrameDragEnd(e) {
  e.target.classList.remove("dragging");
  document
    .querySelectorAll("#frameList .frame-item.drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  draggedFrameIndex = null;
  console.log("Frame Drag End");
}
function addTimelineListeners() {
  addFrameButton.addEventListener("click", () => addEmptyFrame(true));
  duplicateFrameButton.addEventListener("click", () =>
    duplicateCurrentFrame(true)
  );
  frameList.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });
  frameList.addEventListener("drop", handleFrameDrop);
}

// --- Delete Logic ---
function showConfirmModal(message, onConfirm) {
  if (isModalOpen) return;
  isModalOpen = true;
  confirmMessage.textContent = message;
  confirmCallback = onConfirm;
  confirmModalBackdrop.style.display = "block";
  confirmModal.style.display = "block";
  confirmOkButton.focus();
}
function hideConfirmModal() {
  confirmModalBackdrop.style.display = "none";
  confirmModal.style.display = "none";
  isModalOpen = false;
  confirmCallback = null;
}
function addConfirmModalListeners() {
  confirmOkButton.addEventListener("click", () => {
    if (typeof confirmCallback === "function") {
      confirmCallback();
    }
    hideConfirmModal();
  });
  confirmCancelButton.addEventListener("click", hideConfirmModal);
  confirmModalBackdrop.addEventListener("click", hideConfirmModal);
}
function handleDeleteFrame(index) {
  if (animationData.length <= 1) {
    alert("Cannot delete the last frame.");
    return;
  }
  showConfirmModal(`Delete Frame ${index + 1}? This cannot be undone.`, () => {
    console.log("Deleting frame at index", index);
    animationData.splice(index, 1);
    if (activeFrameIndex >= index) {
      activeFrameIndex = Math.max(0, activeFrameIndex - 1);
    }
    renderTimelinePanel();
    renderLayersPanel();
    render();
  });
}
function handleDeleteLayer(layerId, layerName) {
  // Prevent deleting if it's the last pixel layer
  const pixelLayers = animationData[activeFrameIndex].layers.filter(
    (layer) => layer.type === "pixel"
  );
  if (pixelLayers.length <= 1) {
    alert("Cannot delete the last pixel layer.");
    return;
  }

  // Find the layer to be deleted
  const layerToDelete = animationData[activeFrameIndex].layers.find(
    (layer) => layer.id === layerId
  );
  // Prevent deleting reference layers via this function (handled by handleDeleteReferenceLayer)
  if (!layerToDelete || layerToDelete.type === "reference") {
    console.warn(
      "Attempted to delete a non-pixel or non-existent layer via handleDeleteLayer:",
      layerId
    );
    return;
  }

  showConfirmModal(
    `Delete Layer "${layerName}" from all frames? This cannot be undone.`,
    () => {
      console.log("Deleting pixel layer ID:", layerId);
      let deletedLayerActualIndex = -1; // Store the actual index in the active frame

      animationData.forEach((frame) => {
        const indexToRemove = frame.layers.findIndex((l) => l.id === layerId);
        if (indexToRemove !== -1) {
          if (frame.id === animationData[activeFrameIndex].id) {
            deletedLayerActualIndex = indexToRemove;
          }
          frame.layers.splice(indexToRemove, 1);
        }
      });

      // Adjust active layer index if the deleted layer was the active one or below it
      if (deletedLayerActualIndex !== -1) {
        // Find the index of the previously active layer ID in the modified array
        const previouslyActiveLayerId = layerToDelete.id; // This is the ID of the layer that *was* active
        let newActiveLayerIndex = animationData[
          activeFrameIndex
        ].layers.findIndex((layer) => layer.id === previouslyActiveLayerId);

        if (newActiveLayerIndex === -1) {
          // The previously active layer was deleted.
          // Try to set the active layer to the one that is now at the deleted layer's position,
          // but ensure it's a pixel layer.
          let potentialNewIndex = Math.max(0, deletedLayerActualIndex - 1);
          while (
            potentialNewIndex < animationData[activeFrameIndex].layers.length &&
            animationData[activeFrameIndex].layers[potentialNewIndex].type !==
              "pixel"
          ) {
            potentialNewIndex++;
          }
          if (
            potentialNewIndex < animationData[activeFrameIndex].layers.length
          ) {
            activeLayerIndex = potentialNewIndex;
          } else {
            // No pixel layers found after deletion (shouldn't happen if we can't delete the last)
            activeLayerIndex = 0; // Fallback
          }
        } else {
          // The previously active layer was not deleted (it was a different layer).
          // We just need to make sure the activeLayerIndex still points to a valid pixel layer.
          // If the current activeLayerIndex is now out of bounds or points to a reference layer,
          // find the closest valid pixel layer.
          if (
            activeLayerIndex >= animationData[activeFrameIndex].layers.length ||
            animationData[activeFrameIndex].layers[activeLayerIndex].type !==
              "pixel"
          ) {
            let searchIndex = Math.min(
              activeLayerIndex,
              animationData[activeFrameIndex].layers.length - 1
            );
            while (
              searchIndex >= 0 &&
              animationData[activeFrameIndex].layers[searchIndex].type !==
                "pixel"
            ) {
              searchIndex--;
            }
            if (searchIndex >= 0) {
              activeLayerIndex = searchIndex;
            } else {
              // No pixel layers left (shouldn't happen due to the initial check)
              activeLayerIndex = 0; // Fallback
            }
          }
        }
      }

      renderLayersPanel();
      render(); // Re-render canvas as content changed
    }
  );
}

// Handle deleting the reference layer
function handleDeleteReferenceLayer() {
  const referenceLayer = animationData[activeFrameIndex].layers.find(
    (layer) => layer.type === "reference"
  );
  if (!referenceLayer) {
    console.warn("Attempted to delete reference layer, but none exists.");
    return;
  }

  showConfirmModal(
    `Delete the Reference Image Layer? This cannot be undone.`,
    () => {
      console.log("Deleting reference layer ID:", referenceLayer.id);
      animationData.forEach((frame) => {
        const indexToRemove = frame.layers.findIndex(
          (l) => l.type === "reference"
        );
        if (indexToRemove !== -1) {
          frame.layers.splice(indexToRemove, 1);
        }
      });

      // After deleting the reference layer, set the active layer to the first pixel layer
      activeLayerIndex = animationData[activeFrameIndex].layers.findIndex(
        (layer) => layer.type === "pixel"
      );
      if (activeLayerIndex === -1) activeLayerIndex = 0; // Should not happen if we always have at least one pixel layer

      renderLayersPanel();
      render(); // Re-render canvas to remove the reference image
      updateStatus(); // Update status as active layer might change
    }
  );
}

// --- Onion Skinning (Per-Frame) ---
function toggleFrameOnionSkin(frameIndex) {
  if (frameIndex >= 0 && frameIndex < animationData.length) {
    const frame = animationData[frameIndex];
    frame.onionSkinEnabled = !frame.onionSkinEnabled;
    console.log(
      `Frame ${frameIndex + 1} onion skin toggled to:`,
      frame.onionSkinEnabled
    );
    renderTimelinePanel(); // Update button appearance
    render(); // Update canvas view
  }
}
// Removed addOnionSkinListener() and toggleOnionSkin()

// --- Resize Modal Logic ---
function showResizeModal() {
  if (isModalOpen) return;
  console.log("Showing resize modal");
  isModalOpen = true;
  resizeErrorDiv.textContent = "";
  resizeInput.value = `${gridWidth}x${gridHeight}`;
  resizeModalBackdrop.style.display = "block";
  resizeModal.style.display = "block";
  resizeInput.focus();
  resizeInput.select();
}
function hideResizeModal() {
  console.log("Hiding resize modal");
  resizeModalBackdrop.style.display = "none";
  resizeModal.style.display = "none";
  isModalOpen = false;
}
function handleResizeConfirm() {
  const input = resizeInput.value;
  resizeErrorDiv.textContent = "";
  if (!input) {
    resizeErrorDiv.textContent = "Please enter dimensions.";
    return;
  }
  const parts = input.toLowerCase().split("x");
  if (parts.length !== 2) {
    resizeErrorDiv.textContent = "Invalid format. Use WidthxHeight.";
    return;
  }
  const newWidth = parseInt(parts[0], 10);
  const newHeight = parseInt(parts[1], 10);
  if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
    resizeErrorDiv.textContent = "Width/Height must be positive numbers.";
    return;
  }
  console.log(`Resizing to ${newWidth}x${newHeight}`);
  resizeGrid(newWidth, newHeight);
  hideResizeModal();
}
function resizeGrid(newWidth, newHeight) {
  gridWidth = newWidth;
  gridHeight = newHeight;
  animationData.forEach((frame) => {
    frame.layers.forEach((layer) => {
      // Only resize pixel data, not reference images
      if (layer.type === "pixel") {
        // Create new pixel data array with new dimensions
        const newPixels = createPixelData(newWidth, newHeight);
        // Copy existing pixels to the new array (clamped to new dimensions)
        for (let y = 0; y < Math.min(layer.pixels.length, newHeight); y++) {
          for (let x = 0; x < Math.min(layer.pixels[y].length, newWidth); x++) {
            // Ensure the source pixel exists before copying
            if (layer.pixels[y] && layer.pixels[y][x] !== undefined) {
              newPixels[y][x] = layer.pixels[y][x];
            }
          }
        }
        layer.pixels = newPixels;
      }
      // Reference layers are not pixel data, they scale with the canvas display size
      // Their internal position/scale is in pixel coordinates relative to the canvas.
      // We don't need to adjust offsetX/offsetY/scale here as they are canvas-relative.
    });
  });
  setupCanvas();
  cancelPlacement();
  renderLayersPanel(); // Re-render layers panel just in case
  render();
  console.log(
    `Canvas and all pixel layers resized to ${gridWidth}x${gridHeight}`
  );
}

// --- Export Modal Logic ---
function showExportModal() {
  if (isModalOpen) return;
  if (animationData.length <= 1) {
    console.log("Showing single frame export modal");
    isModalOpen = true;
    exportErrorDiv.textContent = "";
    exportInput.value = DEFAULT_EXPORT_SCALE;
    exportModalBackdrop.style.display = "block";
    exportModal.style.display = "block";
    exportInput.focus();
    exportInput.select();
  } else {
    console.log("Showing animation export modal");
    isModalOpen = true;
    animExportError.textContent = "";
    animExportStatus.textContent = "";
    animExportScale.value = DEFAULT_EXPORT_SCALE;
    animExportDelay.value = DEFAULT_FRAME_DELAY;
    animExportLoop.value = DEFAULT_LOOP_COUNT;
    animExportGrid.checked = false;
    animExportFormat.value = "apng";
    animExportModalBackdrop.style.display = "block";
    animExportModal.style.display = "block";
    animExportScale.focus();
  }
}
function hideExportModal() {
  console.log("Hiding single frame export modal");
  exportModalBackdrop.style.display = "none";
  exportModal.style.display = "none";
  isModalOpen = false;
}
function hideAnimExportModal() {
  console.log("Hiding animation export modal");
  animExportModalBackdrop.style.display = "none";
  animExportModal.style.display = "none";
  isModalOpen = false;
  isExportingAnimation = false;
  animExportStartButton.disabled = false;
}
function handleExportConfirm() {
  const scaleFactor = parseInt(exportInput.value, 10);
  exportErrorDiv.textContent = "";
  if (isNaN(scaleFactor) || scaleFactor < 1 || scaleFactor > MAX_EXPORT_SCALE) {
    exportErrorDiv.textContent = `Scale must be 1-${MAX_EXPORT_SCALE}.`;
    return;
  }
  console.log(`Exporting single frame with scale factor: ${scaleFactor}`);
  exportPNG(scaleFactor);
  hideExportModal();
}
function handleAnimExportConfirm() {
  const format = animExportFormat.value;
  const scaleFactor = parseInt(animExportScale.value, 10);
  const delay = parseInt(animExportDelay.value, 10);
  const loop = parseInt(animExportLoop.value, 10);
  const includeGrid = animExportGrid.checked;
  animExportError.textContent = "";
  animExportStatus.textContent = "";
  if (isNaN(scaleFactor) || scaleFactor < 1 || scaleFactor > MAX_EXPORT_SCALE) {
    animExportError.textContent = `Scale must be 1-${MAX_EXPORT_SCALE}.`;
    return;
  }
  if (isNaN(delay) || delay < 10) {
    animExportError.textContent = "Delay must be at least 10ms.";
    return;
  }
  if (isNaN(loop) || loop < 0) {
    animExportError.textContent = "Loop count must be 0 or greater.";
    return;
  }
  console.log(
    `Starting Animation Export: Format=${format}, Scale=${scaleFactor}, Delay=${delay}, Loop=${loop}, Grid=${includeGrid}`
  );
  animExportStatus.textContent = "Preparing frames...";
  animExportStartButton.disabled = true;
  isExportingAnimation = true;
  setTimeout(() => {
    try {
      if (format === "gif") {
        exportGIF(scaleFactor, delay, loop, includeGrid);
      } else if (format === "apng") {
        exportAPNG(scaleFactor, delay, loop, includeGrid);
      }
    } catch (error) {
      console.error("Animation export failed:", error);
      animExportError.textContent = `Export failed: ${error.message}`;
      animExportStartButton.disabled = false;
      isExportingAnimation = false;
    }
  }, 50);
}
function addModalListeners() {
  resizeOkButton.addEventListener("click", handleResizeConfirm);
  resizeCancelButton.addEventListener("click", hideResizeModal);
  resizeModalBackdrop.addEventListener("click", hideResizeModal);
  resizeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleResizeConfirm();
    } else if (e.key === "Escape") {
      hideResizeModal();
    }
  });
  exportOkButton.addEventListener("click", handleExportConfirm);
  exportCancelButton.addEventListener("click", hideExportModal);
  exportModalBackdrop.addEventListener("click", hideExportModal);
  exportInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleExportConfirm();
    } else if (e.key === "Escape") {
      hideExportModal();
    }
  });
  animExportStartButton.addEventListener("click", handleAnimExportConfirm);
  animExportCancelButton.addEventListener("click", hideAnimExportModal);
  animExportModalBackdrop.addEventListener("click", hideAnimExportModal);
  [animExportScale, animExportDelay, animExportLoop].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAnimExportConfirm();
      } else if (e.key === "Escape") {
        hideAnimExportModal();
      }
    });
  });
  animExportFormat.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideAnimExportModal();
    }
  });
  animExportGrid.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideAnimExportModal();
    }
  });
}

// --- Export/Save(o)/Load Functionality ---
function renderFrameToCanvas(frameIndex, scaleFactor, includeGrid) {
  if (frameIndex < 0 || frameIndex >= animationData.length) return null;
  const frame = animationData[frameIndex];
  scaleFactor = Math.max(1, Math.floor(scaleFactor || 1));

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = gridWidth * scaleFactor;
  tempCanvas.height = gridHeight * scaleFactor;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.imageSmoothingEnabled = false;

  // Sort layers for rendering (reference first)
  const layersToDraw = [...frame.layers].sort((a, b) => {
    if (a.type === "reference" && b.type !== "reference") return -1;
    if (a.type !== "reference" && b.type === "reference") return 1;
    return 0; // Maintain original order for same types
  });

  layersToDraw.forEach((layer) => {
    if (layer.isVisible) {
      if (layer.type === "pixel") {
        // Draw pixel data scaled
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const color = layer.pixels[y][x];
            if (color !== eraseColor) {
              tempCtx.fillStyle = color;
              tempCtx.fillRect(
                x * scaleFactor,
                y * scaleFactor,
                scaleFactor,
                scaleFactor
              );
            }
          }
        }
      } else if (layer.type === "reference" && layer.imageDataUrl) {
        // Draw reference image scaled and positioned
        const refImage = layer._image; // Use the stored Image object
        if (refImage && refImage.complete && refImage.naturalWidth > 0) {
          tempCtx.globalAlpha = REFERENCE_LAYER_OPACITY; // Apply opacity

          const scaledWidth = refImage.naturalWidth * layer.scale * scaleFactor;
          const scaledHeight =
            refImage.naturalHeight * layer.scale * scaleFactor;
          const offsetX = layer.offsetX * scaleFactor;
          const offsetY = layer.offsetY * scaleFactor;

          tempCtx.drawImage(
            refImage,
            offsetX,
            offsetY,
            scaledWidth,
            scaledHeight
          );
          tempCtx.globalAlpha = 1; // Reset alpha
        } else if (layer.imageDataUrl) {
          // If image is not loaded, try loading it for export
          const img = new Image();
          img.onload = () => {
            tempCtx.globalAlpha = REFERENCE_LAYER_OPACITY;
            const scaledWidth = img.naturalWidth * layer.scale * scaleFactor;
            const scaledHeight = img.naturalHeight * layer.scale * scaleFactor;
            const offsetX = layer.offsetX * scaleFactor;
            const offsetY = layer.offsetY * scaleFactor;
            tempCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
            tempCtx.globalAlpha = 1;
            // Note: This still has potential timing issues for immediate export.
            // Pre-loading in exportGIF/APNG is more reliable.
          };
          img.onerror = (e) => {
            console.error("Error loading reference image for export:", e);
          };
          img.src = layer.imageDataUrl;
        }
      }
    }
  });

  if (includeGrid && scaleFactor > 1) {
    drawGridOnContext(
      tempCtx,
      gridWidth,
      gridHeight,
      scaleFactor,
      exportGridColor
    );
  }

  return tempCanvas;
}
function exportGIF(scaleFactor, delay, loop, includeGrid) {
  animExportStatus.textContent = "Loading reference images...";
  // Pre-load all reference images across all frames
  const refImagesToLoad = [];
  animationData.forEach((frame) => {
    frame.layers.forEach((layer) => {
      if (layer.type === "reference" && layer.imageDataUrl) {
        // If image object doesn't exist or src has changed, create/update it
        if (!layer._image || layer._image.src !== layer.imageDataUrl) {
          const img = new Image();
          img.src = layer.imageDataUrl;
          layer._image = img; // Store the image object
        }
        // If the image is not complete, add its load promise
        if (!layer._image.complete) {
          refImagesToLoad.push(
            new Promise((resolve, reject) => {
              layer._image.onload = resolve;
              layer._image.onerror = reject;
            })
          );
        }
      }
    });
  });

  Promise.all(refImagesToLoad)
    .then(() => {
      animExportStatus.textContent = "Encoding GIF (Frame 1)...";
      const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript:
          "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js",
        width: gridWidth * scaleFactor,
        height: gridHeight * scaleFactor,
        background: "#00000000",
        transparent: true,
      });

      for (let i = 0; i < animationData.length; i++) {
        animExportStatus.textContent = `Encoding GIF (Frame ${i + 1}/${
          animationData.length
        })...`;
        const frameCanvas = renderFrameToCanvas(i, scaleFactor, includeGrid); // This will use the pre-loaded images
        if (frameCanvas) {
          gif.addFrame(frameCanvas, { delay: delay });
        } else {
          console.warn(`Skipping invalid frame index ${i} during GIF export`);
        }
      }

      gif.on("finished", function (blob) {
        animExportStatus.textContent = "GIF export finished!";
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `pixel-animation-${gridWidth}x${gridHeight}-x${scaleFactor}.gif`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        console.log("GIF export complete.");
        setTimeout(hideAnimExportModal, 1000);
      });

      gif.on("progress", function (p) {
        animExportStatus.textContent = `Encoding GIF... (${Math.round(
          p * 100
        )}%)`;
      });

      console.log("Rendering GIF...");
      animExportStatus.textContent = "Rendering GIF...";
      gif.render();
    })
    .catch((error) => {
      console.error("Error loading reference images for GIF export:", error);
      animExportError.textContent = `Export failed: Error loading reference images.`;
      animExportStartButton.disabled = false;
      isExportingAnimation = false;
    });
}

function exportAPNG(scaleFactor, delay, loop, includeGrid) {
  animExportStatus.textContent = "Loading reference images...";
  // Pre-load all reference images across all frames (same logic as GIF)
  const refImagesToLoad = [];
  animationData.forEach((frame) => {
    frame.layers.forEach((layer) => {
      if (layer.type === "reference" && layer.imageDataUrl) {
        // If image object doesn't exist or src has changed, create/update it
        if (!layer._image || layer._image.src !== layer.imageDataUrl) {
          const img = new Image();
          img.src = layer.imageDataUrl;
          layer._image = img; // Store the image object
        }
        // If the image is not complete, add its load promise
        if (!layer._image.complete) {
          refImagesToLoad.push(
            new Promise((resolve, reject) => {
              layer._image.onload = resolve;
              layer._image.onerror = reject;
            })
          );
        }
      }
    });
  });

  Promise.all(refImagesToLoad)
    .then(() => {
      animExportStatus.textContent = "Encoding APNG (Frame 1)...";
      const frames = [];
      const delays = [];

      for (let i = 0; i < animationData.length; i++) {
        animExportStatus.textContent = `Encoding APNG (Frame ${i + 1}/${
          animationData.length
        })...`;
        const frameCanvas = renderFrameToCanvas(i, scaleFactor, includeGrid); // This will use the pre-loaded images
        if (frameCanvas) {
          const frameCtx = frameCanvas.getContext("2d");
          const imageData = frameCtx.getImageData(
            0,
            0,
            frameCanvas.width,
            frameCanvas.height
          );
          frames.push(imageData.data.buffer);
          delays.push(delay);
        } else {
          console.warn(`Skipping invalid frame index ${i} during APNG export`);
        }
      }

      if (frames.length === 0) {
        throw new Error("No valid frames to encode for APNG.");
      }

      animExportStatus.textContent = "Finalizing APNG...";
      console.log("Encoding APNG...");
      const apngData = UPNG.encode(
        frames,
        gridWidth * scaleFactor,
        gridHeight * scaleFactor,
        0,
        delays,
        loop
      );

      animExportStatus.textContent = "APNG export finished!";
      const blob = new Blob([apngData], { type: "image/apng" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `pixel-animation-${gridWidth}x${gridHeight}-x${scaleFactor}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      console.log("APNG export complete.");
      setTimeout(hideAnimExportModal, 1000);
    })
    .catch((error) => {
      console.error("Error loading reference images for APNG export:", error);
      animExportError.textContent = `Export failed: Error loading reference images.`;
      animExportStartButton.disabled = false;
      isExportingAnimation = false;
    });
}

function exportPNG(scaleFactor = 1, includeGrid = false) {
  // For single frame export, we also need to ensure the reference image is loaded
  const activeFrame = animationData[activeFrameIndex];
  const refLayer = activeFrame.layers.find(
    (layer) => layer.type === "reference"
  );

  const proceedExport = () => {
    const frameCanvas = renderFrameToCanvas(
      activeFrameIndex,
      scaleFactor,
      includeGrid
    );
    if (!frameCanvas) {
      console.error("Failed to render active frame for export.");
      return;
    }
    const link = document.createElement("a");
    const gridSuffix = includeGrid ? "-grid" : "";
    link.download = `pixel-anim-frame${
      activeFrameIndex + 1
    }-${gridWidth}x${gridHeight}-x${scaleFactor}${gridSuffix}.png`;
    link.href = frameCanvas.toDataURL("image/png");
    link.click();
    console.log("Single frame PNG export initiated.");
  };

  if (refLayer && refLayer.imageDataUrl) {
    if (!refLayer._image || !refLayer._image.complete) {
      // Load the image if not loaded
      refLayer._image = new Image();
      refLayer._image.onload = proceedExport;
      refLayer._image.onerror = (e) => {
        console.error(
          "Error loading reference image for single frame export:",
          e
        );
        alert("Error loading reference image for export.");
      };
      refLayer._image.src = refLayer.imageDataUrl;
    } else {
      // Image is already loaded, proceed directly
      proceedExport();
    }
  } else {
    // No reference layer, proceed directly
    proceedExport();
  }
}

function drawGridOnContext(targetCtx, width, height, scale, color) {
  targetCtx.strokeStyle = color;
  targetCtx.lineWidth = 1;
  for (let x = 1; x < width; x++) {
    targetCtx.beginPath();
    targetCtx.moveTo(x * scale - 0.5, 0);
    targetCtx.lineTo(x * scale - 0.5, height * scale);
    targetCtx.stroke();
  }
  for (let y = 1; y < height; y++) {
    targetCtx.beginPath();
    targetCtx.moveTo(0, y * scale - 0.5);
    targetCtx.lineTo(width * scale, y * scale - 0.5);
    targetCtx.stroke();
  }
}
function saveJSON() {
  if (isModalOpen) return;
  console.log("Saving Animation JSON...");
  // Ensure all frames have the onionSkinEnabled property before saving
  animationData.forEach((frame) => {
    if (typeof frame.onionSkinEnabled !== "boolean") {
      frame.onionSkinEnabled = false; // Add default if missing
    }
    // Ensure all layers have type and necessary properties
    frame.layers.forEach((layer) => {
      if (!layer.type) layer.type = "pixel"; // Default to pixel
      if (layer.type === "pixel" && !layer.pixels)
        layer.pixels = createPixelData(gridWidth, gridHeight);
      if (layer.type === "reference") {
        if (!layer.imageDataUrl) layer.imageDataUrl = null;
        if (typeof layer.offsetX !== "number") layer.offsetX = 0;
        if (typeof layer.offsetY !== "number") layer.offsetY = 0;
        if (typeof layer.scale !== "number") layer.scale = 1.0;
      }
      // Remove temporary _image object before saving
      if (layer._image) delete layer._image;
    });
  });
  const saveData = {
    version: 5, // Increment version for reference layer position/scale
    width: gridWidth,
    height: gridHeight,
    palette: paletteColors,
    animationData: animationData,
    nextFrameId: nextFrameId,
    nextLayerId: nextLayerId,
  };
  const dataStr = JSON.stringify(saveData);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "pixel-animation-v5.json"; // Indicate version
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  console.log("Animation JSON save initiated.");
}
function loadJSON() {
  if (isModalOpen) return;
  console.log("Initiating Animation JSON load...");
  fileLoader.click();
}
fileLoader.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected.");
    return;
  }
  console.log(`File selected: ${file.name}`);
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const loadedData = JSON.parse(e.target.result);
      console.log("File content read and parsed.");

      let loadedSuccessfully = false;

      // Check for V5 structure (with reference layer position/scale)
      if (
        loadedData.version === 5 &&
        typeof loadedData.width === "number" &&
        loadedData.width > 0 &&
        typeof loadedData.height === "number" &&
        loadedData.height > 0 &&
        Array.isArray(loadedData.animationData) &&
        loadedData.animationData.length > 0 &&
        typeof loadedData.nextFrameId === "number" &&
        typeof loadedData.nextLayerId === "number" &&
        (!loadedData.palette || Array.isArray(loadedData.palette))
      ) {
        console.log(
          `Loading V5: ${loadedData.width}x${loadedData.height}, Frames: ${loadedData.animationData.length}`
        );
        gridWidth = loadedData.width;
        gridHeight = loadedData.height;
        animationData = loadedData.animationData;
        nextFrameId = loadedData.nextFrameId;
        nextLayerId = loadedData.nextLayerId;
        activeFrameIndex = 0;
        activeLayerIndex = 0; // Will be adjusted below

        // Ensure layer types and properties are correct (backward compatibility / data integrity)
        animationData.forEach((frame) => {
          frame.layers.forEach((layer) => {
            if (!layer.type) layer.type = "pixel"; // Default to pixel if type is missing
            if (layer.type === "pixel" && !layer.pixels)
              layer.pixels = createPixelData(gridWidth, gridHeight);
            if (layer.type === "reference") {
              if (!layer.imageDataUrl) layer.imageDataUrl = null;
              if (typeof layer.offsetX !== "number") layer.offsetX = 0; // Add if missing
              if (typeof layer.offsetY !== "number") layer.offsetY = 0; // Add if missing
              if (typeof layer.scale !== "number") layer.scale = 1.0; // Add if missing
            }
            // Add onionSkinEnabled if missing (for frames)
            if (typeof frame.onionSkinEnabled !== "boolean") {
              frame.onionSkinEnabled = false;
            }
            // Pre-load reference images if they exist
            if (layer.type === "reference" && layer.imageDataUrl) {
              const img = new Image();
              img.src = layer.imageDataUrl;
              layer._image = img; // Store the image object for rendering
              // No need to wait for load here, rendering handles it
            }
          });
          // Ensure at least one pixel layer exists after loading
          if (!frame.layers.some((layer) => layer.type === "pixel")) {
            const defaultPixelLayer = createLayerObject(
              "Layer 1",
              "pixel",
              true
            );
            frame.layers.push(defaultPixelLayer);
            console.warn(
              `Frame ${frame.id} had no pixel layers after load, added a default.`
            );
          }
        });

        if (loadedData.palette) {
          console.log("Loading palette colors.");
          if (loadedData.palette.every((c) => typeof c === "string")) {
            paletteColors = loadedData.palette;
            generatePalette();
          } else {
            console.warn("Loaded palette data invalid, using default.");
          }
        }

        loadedSuccessfully = true;
      }
      // Check for V4 structure (with reference layers, no position/scale)
      else if (
        loadedData.version === 4 &&
        typeof loadedData.width === "number" &&
        loadedData.width > 0 &&
        typeof loadedData.height === "number" &&
        loadedData.height > 0 &&
        Array.isArray(loadedData.animationData) &&
        loadedData.animationData.length > 0 &&
        typeof loadedData.nextFrameId === "number" &&
        typeof loadedData.nextLayerId === "number" &&
        (!loadedData.palette || Array.isArray(loadedData.palette))
      ) {
        console.log(
          `Loading V4: ${loadedData.width}x${loadedData.height}, Frames: ${loadedData.animationData.length}`
        );
        gridWidth = loadedData.width;
        gridHeight = loadedData.height;
        animationData = loadedData.animationData;
        nextFrameId = loadedData.nextFrameId;
        nextLayerId = loadedData.nextLayerId;
        activeFrameIndex = 0;
        activeLayerIndex = 0; // Will be adjusted below

        // Ensure layer types and properties are correct (backward compatibility / data integrity)
        animationData.forEach((frame) => {
          frame.layers.forEach((layer) => {
            if (!layer.type) layer.type = "pixel"; // Default to pixel if type is missing
            if (layer.type === "pixel" && !layer.pixels)
              layer.pixels = createPixelData(gridWidth, gridHeight);
            if (layer.type === "reference") {
              if (!layer.imageDataUrl) layer.imageDataUrl = null;
              layer.offsetX = 0; // Add default position
              layer.offsetY = 0; // Add default position
              layer.scale = 1.0; // Add default scale
            }
            // Add onionSkinEnabled if missing (for frames)
            if (typeof frame.onionSkinEnabled !== "boolean") {
              frame.onionSkinEnabled = false;
            }
            // Pre-load reference images if they exist
            if (layer.type === "reference" && layer.imageDataUrl) {
              const img = new Image();
              img.src = layer.imageDataUrl;
              layer._image = img; // Store the image object for rendering
              // No need to wait for load here, rendering handles it
            }
          });
          // Ensure at least one pixel layer exists after loading
          if (!frame.layers.some((layer) => layer.type === "pixel")) {
            const defaultPixelLayer = createLayerObject(
              "Layer 1",
              "pixel",
              true
            );
            frame.layers.push(defaultPixelLayer);
            console.warn(
              `Frame ${frame.id} had no pixel layers after load, added a default.`
            );
          }
        });

        if (loadedData.palette) {
          console.log("Loading palette colors.");
          if (loadedData.palette.every((c) => typeof c === "string")) {
            paletteColors = loadedData.palette;
            generatePalette();
          } else {
            console.warn("Loaded palette data invalid, using default.");
          }
        }

        loadedSuccessfully = true;
      }
      // Check for V3 structure (onion skin, no reference)
      else if (
        loadedData.version === 3 &&
        typeof loadedData.width === "number" &&
        loadedData.width > 0 &&
        typeof loadedData.height === "number" &&
        loadedData.height > 0 &&
        Array.isArray(loadedData.animationData) &&
        loadedData.animationData.length > 0 &&
        typeof loadedData.nextFrameId === "number" &&
        typeof loadedData.nextLayerId === "number" &&
        (!loadedData.palette || Array.isArray(loadedData.palette))
      ) {
        console.log(
          `Loading V3: ${loadedData.width}x${loadedData.height}, Frames: ${loadedData.animationData.length}`
        );
        gridWidth = loadedData.width;
        gridHeight = loadedData.height;
        animationData = loadedData.animationData;
        nextFrameId = loadedData.nextFrameId;
        nextLayerId = loadedData.nextLayerId;
        activeFrameIndex = 0;
        activeLayerIndex = 0; // Will be adjusted below

        // Add onionSkinEnabled: false and type: 'pixel' to each loaded frame/layer
        animationData.forEach((frame) => {
          frame.onionSkinEnabled = false;
          frame.layers.forEach((layer) => {
            layer.type = "pixel";
            if (!layer.pixels)
              layer.pixels = createPixelData(gridWidth, gridHeight);
          });
          // Ensure at least one pixel layer exists
          if (frame.layers.length === 0) {
            const defaultPixelLayer = createLayerObject(
              "Layer 1",
              "pixel",
              true
            );
            frame.layers.push(defaultPixelLayer);
            console.warn(
              `Frame ${frame.id} had no layers after V3 load, added a default pixel layer.`
            );
          }
        });

        if (loadedData.palette) {
          console.log("Loading palette colors.");
          if (loadedData.palette.every((c) => typeof c === "string")) {
            paletteColors = loadedData.palette;
            generatePalette();
          } else {
            console.warn("Loaded palette data invalid, using default.");
          }
        }

        loadedSuccessfully = true;
      }
      // Check for V2 structure (no onion skin, no reference)
      else if (
        loadedData.version === 2 &&
        typeof loadedData.width === "number" &&
        loadedData.width > 0 &&
        typeof loadedData.height === "number" &&
        loadedData.height > 0 &&
        Array.isArray(loadedData.animationData) &&
        loadedData.animationData.length > 0 &&
        typeof loadedData.nextFrameId === "number" &&
        typeof loadedData.nextLayerId === "number" &&
        (!loadedData.palette || Array.isArray(loadedData.palette))
      ) {
        console.log(
          `Loading V2: ${loadedData.width}x${loadedData.height}, Frames: ${loadedData.animationData.length}`
        );
        gridWidth = loadedData.width;
        gridHeight = loadedData.height;
        animationData = loadedData.animationData;
        nextFrameId = loadedData.nextFrameId;
        nextLayerId = loadedData.nextLayerId;
        activeFrameIndex = 0;
        activeLayerIndex = 0; // Will be adjusted below

        // Add onionSkinEnabled: false and type: 'pixel' to each loaded frame/layer
        animationData.forEach((frame) => {
          frame.onionSkinEnabled = false;
          frame.layers.forEach((layer) => {
            layer.type = "pixel";
            if (!layer.pixels)
              layer.pixels = createPixelData(gridWidth, gridHeight);
          });
          // Ensure at least one pixel layer exists
          if (frame.layers.length === 0) {
            const defaultPixelLayer = createLayerObject(
              "Layer 1",
              "pixel",
              true
            );
            frame.layers.push(defaultPixelLayer);
            console.warn(
              `Frame ${frame.id} had no layers after V2 load, added a default pixel layer.`
            );
          }
        });

        if (loadedData.palette) {
          console.log("Loading palette colors.");
          if (loadedData.palette.every((c) => typeof c === "string")) {
            paletteColors = loadedData.palette;
            generatePalette();
          } else {
            console.warn("Loaded palette data invalid, using default.");
          }
        }

        loadedSuccessfully = true;
      }
      // Check for V1 (single frame, 'layers' at top level)
      else if (
        Array.isArray(loadedData.layers) &&
        typeof loadedData.width === "number" &&
        typeof loadedData.height === "number"
      ) {
        console.warn("Loading old format (single frame).");
        gridWidth = loadedData.width;
        gridHeight = loadedData.height;
        paletteColors = loadedData.palette || paletteColors;

        // Ensure layers have type 'pixel'
        loadedData.layers.forEach((layer) => {
          layer.type = "pixel";
          if (!layer.pixels)
            layer.pixels = createPixelData(gridWidth, gridHeight);
        });

        // Create a single frame in the new structure
        const singleFrame = createFrameObject(loadedData.layers);
        singleFrame.onionSkinEnabled = false; // Add default onion skin state

        animationData = [singleFrame];
        nextFrameId = 2;
        // Calculate nextLayerId based on loaded layers
        nextLayerId = 1;
        if (loadedData.layers.length > 0) {
          const maxId = Math.max(...loadedData.layers.map((l) => l.id));
          if (!isNaN(maxId) && maxId >= 1) {
            nextLayerId = maxId + 1;
          } else {
            // If IDs are missing or invalid, re-assign IDs
            console.warn(
              "Layer IDs missing or invalid in V1 load, re-assigning."
            );
            animationData[0].layers.forEach(
              (layer) => (layer.id = nextLayerId++)
            );
          }
        } else {
          // If no layers in V1, add a default pixel layer
          const defaultPixelLayer = createLayerObject("Layer 1", "pixel", true);
          animationData[0].layers.push(defaultPixelLayer);
          console.warn(
            "No layers found in V1 load, added a default pixel layer."
          );
        }

        activeFrameIndex = 0;
        activeLayerIndex = 0; // Will be adjusted below

        generatePalette(); // Regen palette if loaded
        loadedSuccessfully = true;
      } else {
        throw new Error("Invalid or unrecognized JSON file structure.");
      }

      if (loadedSuccessfully) {
        // After loading, ensure activeLayerIndex points to a pixel layer if the previously active
        // layer type doesn't exist in the new data, or if the index is out of bounds.
        const currentFrameLayers = animationData[activeFrameIndex].layers;
        const previouslyActiveLayer = currentFrameLayers[activeLayerIndex];

        if (!previouslyActiveLayer || previouslyActiveLayer.type !== "pixel") {
          // Find the first pixel layer
          let newActiveIndex = currentFrameLayers.findIndex(
            (layer) => layer.type === "pixel"
          );
          if (newActiveIndex === -1) newActiveIndex = 0; // Should not happen if we add a default layer
          activeLayerIndex = newActiveIndex;
        }
        // If the previously active layer was a pixel layer and still exists, keep its index.

        cancelPlacement();
        setupCanvas();
        renderTimelinePanel();
        renderLayersPanel();
        render();
        updateStatus();
        console.log("Editor updated with loaded data.");
      } else {
        throw new Error("Failed to load data with any recognized version.");
      }
    } catch (error) {
      console.error("Error loading or parsing JSON:", error);
      alert(`Error loading file: ${error.message}`);
    } finally {
      event.target.value = null; // Reset file input
    }
  };
  reader.onerror = (e) => {
    console.error("Error reading file:", e);
    alert("Error reading file.");
    event.target.value = null;
  };
  reader.readAsText(file);
});

// --- Reference Image Loader Listener ---
function addReferenceImageLoaderListener() {
  refImageLoader.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log("No reference image file selected.");
      return;
    }

    // Check if a reference layer already exists
    if (animationData[0].layers.some((layer) => layer.type === "reference")) {
      alert(
        "A reference image layer already exists. Please delete it first to load a new one."
      );
      event.target.value = null; // Reset file input
      return;
    }

    console.log(`Reference image file selected: ${file.name}`);
    const reader = new FileReader();

    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      const img = new Image();

      img.onload = () => {
        console.log(`Reference image loaded: ${img.width}x${img.height}`);
        // Add the reference layer to all frames
        addReferenceLayerToAllFrames(imageDataUrl, img.width, img.height);
        render(); // Re-render to show the new layer
      };

      img.onerror = (e) => {
        console.error("Error loading reference image:", e);
        alert("Error loading reference image.");
      };

      img.src = imageDataUrl;
    };

    reader.onerror = (e) => {
      console.error("Error reading reference image file:", e);
      alert("Error reading reference image file.");
    };

    reader.readAsDataURL(file);
    event.target.value = null; // Reset file input
  });
}

// --- Event Handlers ---
function addGlobalMouseListeners() {
  window.addEventListener("mousemove", handleGlobalMouseMove);
  window.addEventListener("mouseup", handleGlobalMouseUp);
}

// Add mouse listeners specifically to the canvas
function addCanvasMouseListeners() {
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  // Mousemove and mouseup are handled globally to allow dragging outside the canvas
  // canvas.addEventListener('mousemove', handleCanvasMouseMove);
  // canvas.addEventListener('mouseup', handleCanvasMouseUp);
}

// Add mouse wheel listener to the canvas for resizing reference layer
function addCanvasWheelListener() {
  canvas.addEventListener("wheel", handleCanvasWheel);
}

function handleGlobalMouseMove(e) {
  lastMousePos = { x: e.clientX, y: e.clientY };

  // Calculate canvas-relative mouse position
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  const gridX = Math.floor(mouseX / pixelSize);
  const gridY = Math.floor(mouseY / pixelSize);

  // Update currentPos for drawing/selection previews
  currentPos = { gridX, gridY };

  const activeLayer = getActiveLayer();

  // Handle dragging for the active reference layer
  if (
    currentState === "draggingReference" &&
    activeLayer &&
    activeLayer.type === "reference"
  ) {
    // Calculate new offset based on mouse movement since drag start
    activeLayer.offsetX = mouseX - refDragStartOffset.x;
    activeLayer.offsetY = mouseY - refDragStartOffset.y;
    render(); // Re-render to show the dragged image
    return; // Stop processing if dragging reference layer
  }

  // Handle pixel layer interactions if not dragging reference
  if (isDrawing && !isModalOpen) {
    // Only process drawing/selection/move if the active layer is a pixel layer
    if (activeLayer && activeLayer.type === "pixel") {
      if (
        (currentState === "movingSelection" || currentState === "pasting") &&
        startPos &&
        selectionContentData
      ) {
        selectionOffset.x = currentPos.gridX - startPos.gridX;
        selectionOffset.y = currentPos.gridY - startPos.gridY;
        render();
      } else if (
        currentState === "drawingLine" ||
        currentState === "drawingRectangle" ||
        currentState === "selecting"
      ) {
        render();
      } else if (currentTool === "draw" || currentTool === "erase") {
        // Check if the mouse is over the canvas before applying tool
        if (e.target === canvas) {
          applyTool(gridX, gridY);
        }
      }
    }
  }
}
function handleGlobalMouseUp(e) {
  const activeLayer = getActiveLayer();

  // Finalize dragging for the active reference layer
  if (
    currentState === "draggingReference" &&
    activeLayer &&
    activeLayer.type === "reference"
  ) {
    currentState = "idle"; // Return to idle state
    isDrawing = false; // Ensure isDrawing is false
    refDragStartOffset = { x: 0, y: 0 }; // Reset drag offset
    setCanvasCursor(); // Update cursor
    console.log("Reference layer dragging finished.");
    // No render needed here, mousemove already rendered the final position
    return; // Stop processing if finished dragging reference layer
  }

  // Handle pixel layer interactions if not dragging reference
  if (isDrawing && !isModalOpen) {
    isDrawing = false;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    const gridX = Math.max(
      0,
      Math.min(gridWidth - 1, Math.floor(mouseX / pixelSize))
    );
    const gridY = Math.max(
      0,
      Math.min(gridHeight - 1, Math.floor(mouseY / pixelSize))
    );
    const finalClampedPos = { gridX, gridY };
    console.log("Global Mouse Up - Final Clamped Pos:", finalClampedPos);

    // Only finalize actions if the active layer is a pixel layer
    if (activeLayer && activeLayer.type === "pixel") {
      switch (currentState) {
        case "drawingLine":
          finalizeLine(
            startPos.gridX,
            startPos.gridY,
            finalClampedPos.gridX,
            finalClampedPos.gridY
          );
          break;
        case "drawingRectangle":
          finalizeRectangle(
            startPos.gridX,
            startPos.gridY,
            finalClampedPos.gridX,
            finalClampedPos.gridY
          );
          break;
        case "selecting":
          selectionRect = getNormalizedRect(startPos, finalClampedPos);
          if (selectionRect.width <= 0 || selectionRect.height <= 0) {
            selectionRect = null;
          }
          console.log("Selection made (clamped):", selectionRect);
          break;
        case "movingSelection":
        case "pasting":
          console.log("Mouse up during move/paste - keeping state");
          break; // Placement is confirmed on click outside or Enter key
      }
    }

    if (currentState !== "movingSelection" && currentState !== "pasting") {
      currentState = "idle";
    }
    startPos = null;
    currentPos = null;
    setCanvasCursor();
    render();
  }
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function handleCanvasMouseDown(e) {
  if (isModalOpen) return;
  if (paletteJustClosed) return;
  if (colorPalette.style.display !== "none" && colorPalette.contains(e.target))
    return;
  hidePalette();

  const { gridX, gridY } = getMousePos(e);

  // Calculate canvas-relative mouse position in pixels
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX_canvas = (e.clientX - rect.left) * scaleX;
  const mouseY_canvas = (e.clientY - rect.top) * scaleY;

  startPos = { gridX, gridY }; // Grid position for pixel tools
  currentPos = { gridX, gridY };

  const activeLayer = getActiveLayer();

  // Handle interaction based on the active layer type
  if (activeLayer && activeLayer.type === "reference") {
    // If the active layer is a reference layer, start dragging it
    currentState = "draggingReference";
    isDrawing = true; // Use isDrawing to indicate an active mouse interaction
    // Store the offset of the mouse position relative to the image's top-left corner
    refDragStartOffset = {
      x: mouseX_canvas - activeLayer.offsetX,
      y: mouseY_canvas - activeLayer.offsetY,
    };
    setCanvasCursor(); // Update cursor to 'move'
    console.log("Starting reference layer drag.");
    return; // Stop processing, don't start any pixel tool action
  }

  // If the active layer is a pixel layer, proceed with pixel tool logic
  if (activeLayer && activeLayer.type === "pixel") {
    if (currentState === "movingSelection" || currentState === "pasting") {
      const floatingRect = {
        x: selectionOffset.x,
        y: selectionOffset.y,
        width: selectionContentData.width,
        height: selectionContentData.height,
      };
      // Check if the click is inside the floating selection/paste area (in grid coordinates)
      if (
        gridX < floatingRect.x ||
        gridX >= floatingRect.x + floatingRect.width ||
        gridY < floatingRect.y ||
        gridY >= floatingRect.y + floatingRect.height
      ) {
        confirmPlacement(); // Clicked outside, finalize placement
        // After confirming, state is 'idle', continue to start a new action below
      } else {
        // Clicked inside the floating content, start dragging the content
        startPos = {
          gridX: gridX - selectionOffset.x,
          gridY: gridY - selectionOffset.y,
        }; // StartPos relative to content origin
        isDrawing = true; // Use isDrawing to indicate dragging
        setCanvasCursor(); // Update cursor to 'move'
        return; // Stop processing, already handling a move/paste drag
      }
    }

    // If we are in idle state (or just confirmed placement) and clicked on the canvas
    if (currentState === "idle") {
      if (currentTool === "select" && selectionRect) {
        // Check if click is inside existing selection to start moving
        if (
          gridX >= selectionRect.x &&
          gridX < selectionRect.x + selectionRect.width &&
          gridY >= selectionRect.y &&
          gridY < selectionRect.y + selectionRect.height
        ) {
          currentState = "movingSelection";
          originalMoveRect = { ...selectionRect }; // Store original position to clear later
          startPos = {
            gridX: gridX - selectionRect.x,
            gridY: gridY - selectionRect.y,
          }; // StartPos relative to selection origin
          selectionContentData = copySelectionData(selectionRect); // Copy content before clearing original
          selectionOffset = { x: selectionRect.x, y: selectionRect.y }; // Initial offset is original position
          selectionRect = null; // Clear the static selection outline
          setCanvasCursor();
          render();
          isDrawing = true; // Start dragging the selection
          return; // Stop processing, already handling a selection drag
        } else {
          // Clicked outside existing selection, clear it and start a new selection
          selectionRect = null;
          originalMoveRect = null;
          // Fall through to start new selection below
        }
      }

      // Start new action based on current tool
      switch (currentTool) {
        case "draw":
        case "erase":
          isDrawing = true;
          currentState = "idle"; // Stays idle while drawing pixel by pixel
          applyTool(gridX, gridY); // Apply immediately on mousedown
          break;
        case "line":
          isDrawing = true;
          currentState = "drawingLine"; // State changes to drawingLine
          break;
        case "rectangle":
          isDrawing = true;
          currentState = "drawingRectangle"; // State changes to drawingRectangle
          break;
        case "fill":
          isDrawing = false; // Fill is a single click action
          currentState = "idle";
          floodFill(gridX, gridY, drawColor);
          break;
        case "select":
          isDrawing = true; // Dragging to define selection area
          currentState = "selecting";
          selectionRect = null; // Clear any previous selection
          originalMoveRect = null;
          break;
      }
      setCanvasCursor();
      // Render immediately for tools that draw previews (line, rect, select)
      if (
        currentState === "drawingLine" ||
        currentState === "drawingRectangle" ||
        currentState === "selecting"
      ) {
        render();
      }
    }
  }
}

// Handle mouse wheel for resizing the active reference layer
function handleCanvasWheel(e) {
  const activeLayer = getActiveLayer();

  // Only resize if the active layer is a reference layer
  if (activeLayer && activeLayer.type === "reference") {
    e.preventDefault(); // Prevent page scroll

    const delta = Math.sign(e.deltaY); // -1 for scroll up (zoom in), 1 for scroll down (zoom out)
    const zoomFactor = 1 - delta * REFERENCE_LAYER_SCALE_STEP; // Adjust scale based on scroll direction

    const oldScale = activeLayer.scale;
    let newScale = Math.max(0.1, activeLayer.scale * zoomFactor); // Prevent scale from going to zero or negative

    // Calculate mouse position relative to the image's current top-left corner
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX_canvas = (e.clientX - rect.left) * scaleX;
    const mouseY_canvas = (e.clientY - rect.top) * scaleY;

    // Calculate mouse position relative to the *image content* at the old scale
    const mouseX_img_old = (mouseX_canvas - activeLayer.offsetX) / oldScale;
    const mouseY_img_old = (mouseY_canvas - activeLayer.offsetY) / oldScale;

    // Calculate new offset to keep the point under the mouse in the same relative position
    activeLayer.offsetX = mouseX_canvas - mouseX_img_old * newScale;
    activeLayer.offsetY = mouseY_canvas - mouseY_img_old * newScale;

    activeLayer.scale = newScale;

    console.log(`Reference layer scaled to: ${newScale.toFixed(2)}`);
    render(); // Re-render to show the resized image
  }
}

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (event.clientX - rect.left) * scaleX;
  const mouseY = (event.clientY - rect.top) * scaleY;
  const gridX = Math.floor(mouseX / pixelSize);
  const gridY = Math.floor(mouseY / pixelSize);
  return { gridX, gridY };
}
function confirmPlacement() {
  const activeData = getActiveLayerData();
  if (!activeData || !selectionContentData) {
    console.warn(
      "Cannot confirm placement on non-pixel layer or with no content."
    );
    cancelPlacement();
    return;
  }

  let changed = false;
  if (currentState === "movingSelection" && originalMoveRect) {
    changed = clearSelectionArea(originalMoveRect) || changed; // Clear the original location
  }
  changed = stampSelection(selectionContentData, selectionOffset) || changed; // Stamp at the new location

  selectionContentData = null;
  selectionRect = null; // Placement results in no active selection
  originalMoveRect = null;
  currentState = "idle";
  isDrawing = false;
  setCanvasCursor();
  if (changed) render();
  console.log("Placement confirmed.");
}
function cancelPlacement() {
  if (currentState === "movingSelection" || currentState === "pasting") {
    console.log("Placement cancelled.");
    selectionContentData = null;
    selectionRect = null; // Cancellation results in no active selection
    originalMoveRect = null;
    currentState = "idle";
    isDrawing = false;
    setCanvasCursor();
    render(); // Re-render to remove the floating content/outline
  }
}

// --- Tool Grid Listener ---
function addToolGridListeners() {
  toolGrid.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    const button = e.target;
    const tool = button.dataset.tool;
    const action = button.dataset.action;
    if (tool) {
      if (currentTool !== tool) {
        currentTool = tool;
        console.log("Tool changed via button to:", currentTool);
        isDrawing = false;
        cancelPlacement();
        startPos = null;
        hidePalette();
        setCanvasCursor();
        updateStatus();
        render();
      }
    } else if (action) {
      console.log("Action triggered via button:", action);
      switch (action) {
        case "palette":
          showPalette();
          break;
        case "resize":
          showResizeModal();
          break;
        case "export":
          showExportModal();
          break;
        case "exportGrid":
          exportPNG(DEFAULT_EXPORT_SCALE, true);
          break;
        case "save":
          saveJSON();
          break;
        case "load":
          loadJSON();
          break;
      }
    }
  });
}

// --- Keyboard Listener ---
document.addEventListener("keydown", (e) => {
  let actionTaken = false;
  if (e.key === "Escape") {
    if (isModalOpen) {
      if (resizeModal.style.display === "block") hideResizeModal();
      if (exportModal.style.display === "block") hideExportModal();
      if (animExportModal.style.display === "block") hideAnimExportModal();
      if (confirmModal.style.display === "block") hideConfirmModal();
      actionTaken = true;
    } else if (
      currentState === "drawingLine" ||
      currentState === "drawingRectangle" ||
      currentState === "selecting"
    ) {
      isDrawing = false;
      currentState = "idle";
      startPos = null;
      actionTaken = true;
    } else if (
      currentState === "movingSelection" ||
      currentState === "pasting"
    ) {
      cancelPlacement();
      actionTaken = true;
    } else if (selectionRect) {
      selectionRect = null;
      render();
      actionTaken = true;
    } // Clear selection on Escape
    if (actionTaken) {
      setCanvasCursor();
      return;
    }
  }
  if (
    isModalOpen ||
    isExportingAnimation ||
    e.target.tagName === "INPUT" ||
    e.target.tagName === "TEXTAREA"
  )
    return;
  if (colorPalette.style.display !== "none") return;

  let toolChanged = false;
  const activeLayer = getActiveLayer();

  // Only allow copy/cut/paste if the active layer is a pixel layer
  if (activeLayer && activeLayer.type === "pixel") {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case "c":
          if (selectionRect && currentState === "idle") {
            e.preventDefault();
            clipboardData = copySelectionData(selectionRect);
            console.log("Copied from active layer:", clipboardData);
            actionTaken = true;
          }
          break;
        case "x":
          if (selectionRect && currentState === "idle") {
            e.preventDefault();
            clipboardData = copySelectionData(selectionRect);
            if (clearSelectionArea(selectionRect)) render();
            console.log("Cut from active layer:", clipboardData);
            selectionRect = null; // Clear selection after cut
            actionTaken = true;
          }
          break;
        case "v":
          if (clipboardData) {
            e.preventDefault();
            if (
              currentState === "movingSelection" ||
              currentState === "pasting"
            ) {
              cancelPlacement(); // Cancel current placement before pasting new data
            }
            selectionContentData = JSON.parse(JSON.stringify(clipboardData)); // Deep copy clipboard data
            selectionOffset = { x: 0, y: 0 }; // Start paste at origin
            currentState = "pasting";
            startPos = { gridX: 0, gridY: 0 }; // Start drag relative to origin
            selectionRect = null; // Pasting replaces any selection
            originalMoveRect = null;
            console.log("Pasting onto active layer");
            actionTaken = true;
            setCanvasCursor();
            render(); // Render the floating paste content
          }
          break;
      }
      if (actionTaken) return;
    }
  }

  switch (e.key.toLowerCase()) {
    case "d":
      currentTool = "draw";
      toolChanged = true;
      break;
    case "t":
      currentTool = "line";
      toolChanged = true;
      break;
    case "r":
      currentTool = "rectangle";
      toolChanged = true;
      break;
    case "f":
      currentTool = "fill";
      toolChanged = true;
      break;
    case "x":
      currentTool = "erase";
      toolChanged = true;
      break;
    case "s":
      currentTool = "select";
      toolChanged = true;
      break;
    case "c":
      e.preventDefault();
      showPalette();
      actionTaken = true;
      break;
    case "1":
      e.preventDefault();
      showResizeModal();
      actionTaken = true;
      break;
    case "e":
      if (e.shiftKey) {
        e.preventDefault();
        console.log("Exporting frame with grid (default scale)...");
        exportPNG(DEFAULT_EXPORT_SCALE, true);
        actionTaken = true;
      } else {
        e.preventDefault();
        showExportModal();
        actionTaken = true;
      }
      break;
    case "o":
      e.preventDefault();
      saveJSON();
      actionTaken = true;
      break; // Alt+O removed as shortcut
    case "l":
      e.preventDefault();
      loadJSON();
      actionTaken = true;
      break;
    case "enter":
      if (currentState === "movingSelection" || currentState === "pasting") {
        confirmPlacement();
        actionTaken = true;
      }
      break;
    case "backspace":
    case "delete":
      // Only allow deleting selection on pixel layers in idle state
      if (
        selectionRect &&
        currentState === "idle" &&
        activeLayer &&
        activeLayer.type === "pixel"
      ) {
        e.preventDefault();
        if (clearSelectionArea(selectionRect)) render();
        selectionRect = null;
        actionTaken = true;
      }
      break;
    default:
      return;
  }

  if (toolChanged) {
    isDrawing = false;
    cancelPlacement();
    startPos = null;
    hidePalette();
    setCanvasCursor();
    updateStatus();
    render();
  } else if (actionTaken) {
    setCanvasCursor();
  } // Update cursor if an action changed state
});

// Update Status
function updateStatus() {
  const toolText = currentTool.charAt(0).toUpperCase() + currentTool.slice(1);
  const activeLayer = getActiveLayer();
  const layerName = activeLayer ? activeLayer.name : "None";
  const layerType = activeLayer ? activeLayer.type : "";

  statusDiv.querySelector(
    "#status-line-1 span:first-of-type"
  ).textContent = `Tool: ${toolText} | Color:`;
  colorPreview.style.backgroundColor = drawColor;

  // If active layer is reference, show its scale
  if (activeLayer && activeLayer.type === "reference") {
    statusLine2.textContent += ` | Scale: ${activeLayer.scale.toFixed(2)}`;
  }

  const buttons = toolGrid.querySelectorAll("button");
  buttons.forEach((button) => {
    if (button.dataset.tool === currentTool) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
    // Ensure action buttons don't stay active
    if (button.dataset.action) {
      button.classList.remove("active");
    }
  });
}

// --- Start the editor ---
initializeEditor();
