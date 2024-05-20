import gsap from "gsap";
import NormalizeWheel from "normalize-wheel";
import * as THREE from "three";

import vert from "./shaders/vert.glsl";
import frag from "./shaders/frag.glsl";

function map(valueToMap, inMin, inMax, outMin, outMax) {
  return gsap.utils.mapRange(inMin, inMax, outMin, outMax, valueToMap);
}

const scroll = {
  ease: 0.05,
  scale: 3,
  current: {
    x: 0,
    y: 0,
  },
  target: {
    x: 0,
    y: 0,
  },
  last: {
    x: 0,
    y: 0,
  },
  position: {
    x: 0,
    y: 0,
  },
  speed: {
    x: 0,
    y: 0,
  },
};

class GridGallery {
  constructor({ galleryEl }) {
    this.gallery = galleryEl;
    this.galleryCols = [...this.gallery.querySelectorAll(".gallery-grid-col")];
    this.galleryItems = [
      ...this.gallery.querySelectorAll(".gallery-grid-figure"),
    ];

    this.gap = 50;

    // bounds
    this.galleryBounds = this.gallery.clientWidth + this.gap;
    this.colsBounds = this.galleryCols[0].clientWidth + this.gap;

    this.wrapSizeX = this.colsBounds * this.galleryCols.length;

    this.isDragging = false;

    this.init();
    this.render();
  }

  init() {
    this.createGrid();
    this.addEvents();
  }

  createGrid(scroll) {
    gsap.set(this.galleryCols, {
      x: (i) => {
        return i * this.colsBounds + scroll;
      },
      modifiers: {
        x: (x) => {
          const s = gsap.utils.wrap(
            -this.colsBounds,
            this.wrapSizeX - this.colsBounds,
            parseInt(x)
          );
          return `${s}px`;
        },
      },
    });
  }

  createGridCols(element, scroll, index) {
    this.items = [...element.querySelectorAll(".gallery-grid-figure")];
    this.itemBounds = this.items[0].clientHeight + this.gap;
    this.wrapSizeY = this.itemBounds * this.items.length;

    gsap.set(this.items, {
      y: (i) => {
        return i * this.itemBounds + scroll;
      },
      modifiers: {
        y: (y) => {
          const s = gsap.utils.wrap(
            -this.itemBounds,
            this.wrapSizeY - this.itemBounds,
            parseInt(y)
          );
          return `${s}px`;
        },
      },
    });
  }

  resize() {
    this.galleryBounds = this.gallery.clientWidth + this.gap;
    this.colsBounds = this.galleryCols[0].clientWidth + this.gap;
    this.wrapSizeX = this.colsBounds * this.galleryCols.length;
  }

  mouseWheel(e) {
    let normalized = NormalizeWheel(e);
    scroll.target.x -= normalized.pixelX * scroll.scale;
    scroll.target.y -= normalized.pixelY * scroll.scale;
  }

  handleTouchStart(e) {
    this.isDragging = true;
    scroll.position.x = scroll.current.x;
    scroll.position.y = scroll.current.y;

    this.startX = e.touches ? e.touches[0].clientX : e.clientX;
    this.startY = e.touches ? e.touches[0].clientY : e.clientY;
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    const distanceX = (x - this.startX) * scroll.scale;
    const distanceY = (y - this.startY) * scroll.scale;

    scroll.target.x = scroll.position.x + distanceX;
    scroll.target.y = scroll.position.y + distanceY;
  }

  handleTouchEnd() {
    this.isDragging = false;
  }

  addEvents() {
    //   mouse wheel event
    window.addEventListener("wheel", this.mouseWheel.bind(this), {
      passive: true,
    });

    //   touch events
    window.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: true,
    });
    window.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: true,
    });
    window.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: true,
    });

    //   mouse events
    window.addEventListener("mousedown", this.handleTouchStart.bind(this), {
      passive: true,
    });
    window.addEventListener("mousemove", this.handleTouchMove.bind(this), {
      passive: true,
    });
    window.addEventListener("mouseup", this.handleTouchEnd.bind(this), {
      passive: true,
    });

    //   resize event
    window.addEventListener("resize", this.resize.bind(this));
  }

  lerp(a, b, n) {
    return (1 - n) * a + n * b;
  }

  render() {
    scroll.current.x = this.lerp(
      scroll.current.x,
      scroll.target.x,
      scroll.ease
    );

    scroll.current.y = this.lerp(
      scroll.current.y,
      scroll.target.y,
      scroll.ease
    );

    this.createGrid(scroll.current.x);

    for (let i = 0; i < this.galleryCols.length; i++) {
      this.createGridCols(this.galleryCols[i], scroll.current.y + i * 100);
    }

    scroll.speed.x = scroll.current.x - scroll.last.x;
    scroll.speed.y = scroll.current.y - scroll.last.y;
    scroll.last.x = scroll.current.x;
    scroll.last.y = scroll.current.y;

    requestAnimationFrame(this.render.bind(this));
  }
}

class Setup {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.perspective = 1000;
    this.fov =
      (180 * (2 * Math.atan(window.innerHeight / 2 / this.perspective))) /
      Math.PI;

    this.setupCamera();
  }

  get viewport() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let aspectRatio = width / height;
    return { width, height, aspectRatio };
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.viewport.aspectRatio,
      1,
      this.perspective
    );
    this.camera.position.set(0, 0, this.perspective);

    this.renderer.sortObjects = false;
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    window.addEventListener("resize", this.onWindowResize.bind(this), false);
  }

  onWindowResize() {
    this.camera.aspect = this.viewport.aspectRatio;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.viewport.width, this.viewport.height);
  }
}

class Plane {
  constructor({ element, scene }) {
    this.element = element;
    this.image = this.element.querySelector("img");
    this.scene = scene;
    this.sizes = new THREE.Vector2(0, 0);
    this.offset = new THREE.Vector2(0, 0);

    this.hover = false;

    this.element.addEventListener("mouseenter", () => {
      this.hover = true;
      gsap.to(this.uniforms.uHover, {
        value: 1,
        duration: 2,
        ease: "power3.out",
      });
    });
    this.element.addEventListener("mouseleave", () => {
      this.hover = false;
      gsap.to(this.uniforms.uHover, {
        value: 0,
        duration: 2,
        ease: "power3.out",
      });
    });

    this.createMesh();
  }

  getDimension() {
    const { width, height, top, left } = this.image.getBoundingClientRect();
    this.sizes.set(width, height);
    this.offset.set(
      left - window.innerWidth / 2 + width / 2,
      -top + window.innerHeight / 2 - height / 2
    );
  }

  createMesh() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
    this.imageTexture = new THREE.TextureLoader().load(this.image.src);
    this.imageTexture.generateMipmaps = false;
    this.uniforms = {
      uTexture: {
        value: this.imageTexture,
      },
      uOffset: {
        value: new THREE.Vector2(0, 0),
      },
      uAlpha: {
        value: 1,
      },
      uPlaneSizes: { value: [0, 0] },
      uImageSizes: { value: [0, 0] },
      uZoom: { value: 0.85 },
      uParallax: { value: new THREE.Vector2(0, 0) },
      uStrength: { value: new THREE.Vector2(0, 0) },
      uGray: { value: 1 },
      uVelo: { value: 0 },
      uViewportSizes: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uHover: { value: 0 },
    };
    this.uniforms.uniformsNeedUpdate = true;
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.getDimension();
    this.mesh.position.set(this.offset.x, this.offset.y, this.z);
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);
    this.scene.add(this.mesh);
  }

  render() {
    this.getDimension();

    this.mesh.position.set(this.offset.x, this.offset.y, 1);
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);

    this.uniforms.uImageSizes.value = [
      this.image.naturalWidth,
      this.image.naturalHeight,
    ];
    this.uniforms.uPlaneSizes.value = [this.mesh.scale.x, this.mesh.scale.y];

    const pivX = (this.mesh.position.x - scroll.current.x / 100) * 0.05;
    const pivY = (this.mesh.position.y - scroll.current.y / 100) * 0.05;

    this.uniforms.uParallax.value.set(
      map(pivX, -1.15, 1.15, -0.005, 0.01),
      map(pivY, -1.15, 1.15, -0.005, 0.01)
    );

    this.uniforms.uStrength.value.set(
      Math.abs((scroll.target.x - scroll.current.x) * 0.15),
      Math.abs((scroll.target.y - scroll.current.y) * 0.15)
    );
  }
}

class Gl {
  constructor({ canvas }) {
    this.setup = new Setup({ canvas });
    this.planes = [];
    this.createPlanes();
  }

  createPlanes() {
    this.planes = [...document.querySelectorAll(".gallery-grid-figure")].map(
      (element) => {
        return new Plane({ element, scene: this.setup.scene });
      }
    );
  }

  render() {
    this.planes.forEach((plane) => {
      plane.render();
    });
    this.setup.renderer.render(this.setup.scene, this.setup.camera);

    requestAnimationFrame(this.render.bind(this));
  }
}

const galleryEl = document.querySelector(".gallery-grid");
const grid = new GridGallery({ galleryEl: galleryEl });

const canvas = document.querySelector("canvas");
const gl = new Gl({ canvas });

gl.render(grid.scroll);
