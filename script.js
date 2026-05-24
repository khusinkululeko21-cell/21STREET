(() => {
  const header = document.querySelector("[data-header]");
  const year = document.querySelector("[data-year]");
  const canvas = document.querySelector("#logistics-scene");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const syncHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  if (!canvas) return;

  window.addEventListener("load", () => {
    if (window.THREE) {
      initThreeScene(canvas);
    } else {
      initCanvasFallback(canvas);
    }
  });

  function initThreeScene(targetCanvas) {
    targetCanvas.dataset.renderer = "three";
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x101820, 22, 58);

    const renderer = new THREE.WebGLRenderer({
      canvas: targetCanvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    camera.position.set(8.2, 6.4, 14.5);

    const world = new THREE.Group();
    world.position.set(2.6, -1.1, 0);
    scene.add(world);

    const ambient = new THREE.HemisphereLight(0xc9f4ff, 0x121a1f, 1.65);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 3.2);
    sun.position.set(-8, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const signalLight = new THREE.PointLight(0xff6b1a, 42, 35);
    signalLight.position.set(-7, 5, 4);
    scene.add(signalLight);

    const aquaLight = new THREE.PointLight(0x00a7a5, 34, 35);
    aquaLight.position.set(7, 4, -5);
    scene.add(aquaLight);

    const mats = {
      asphalt: new THREE.MeshStandardMaterial({ color: 0x202a30, roughness: 0.88, metalness: 0.05 }),
      lane: new THREE.MeshBasicMaterial({ color: 0xe9f3ef, transparent: true, opacity: 0.7 }),
      ground: new THREE.MeshStandardMaterial({ color: 0x17212a, roughness: 0.96, metalness: 0.04 }),
      grid: new THREE.LineBasicMaterial({ color: 0x7a8c8f, transparent: true, opacity: 0.22 }),
      warehouse: new THREE.MeshStandardMaterial({ color: 0xe5ece9, roughness: 0.68, metalness: 0.08 }),
      roof: new THREE.MeshStandardMaterial({ color: 0x44535a, roughness: 0.72, metalness: 0.18 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x70d6d4, roughness: 0.25, metalness: 0.22, emissive: 0x073c3d }),
      orange: new THREE.MeshStandardMaterial({ color: 0xff6b1a, roughness: 0.58, metalness: 0.08 }),
      teal: new THREE.MeshStandardMaterial({ color: 0x00a7a5, roughness: 0.56, metalness: 0.1 }),
      lime: new THREE.MeshStandardMaterial({ color: 0xa7c83f, roughness: 0.6, metalness: 0.08 }),
      white: new THREE.MeshStandardMaterial({ color: 0xf4f6f1, roughness: 0.62, metalness: 0.08 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.7, metalness: 0.12 }),
      tire: new THREE.MeshStandardMaterial({ color: 0x0c1014, roughness: 0.84, metalness: 0.08 }),
      routeAqua: new THREE.MeshBasicMaterial({ color: 0x00e0d8, transparent: true, opacity: 0.78 }),
      routeSignal: new THREE.MeshBasicMaterial({ color: 0xff8a33, transparent: true, opacity: 0.72 }),
      hub: new THREE.MeshStandardMaterial({ color: 0xff6b1a, roughness: 0.42, metalness: 0.22, emissive: 0x371000 })
    };

    buildGround(world, THREE, mats);
    buildRoad(world, THREE, mats, 0, 0, 0, 33, 3.2);
    buildRoad(world, THREE, mats, -2.6, 0, -0.9, 29, 2.55, Math.PI / 2.9);
    buildRoad(world, THREE, mats, 3.4, 0, 0.8, 26, 2.35, -Math.PI / 3.2);
    buildWarehouse(world, THREE, mats, -8.2, 0.1, -5.2, 2.8);
    buildWarehouse(world, THREE, mats, 6.8, 0.1, -4.6, 2.25);
    buildWarehouse(world, THREE, mats, 4.4, 0.1, 5.1, 1.85);
    buildContainerYard(world, THREE, mats);

    const routes = [
      makeRoute(world, THREE, mats.routeAqua, [
        [-8.2, 0.22, -5.2],
        [-4.5, 0.38, -1.2],
        [-0.4, 0.26, 0.4],
        [4.4, 0.32, 5.1]
      ]),
      makeRoute(world, THREE, mats.routeSignal, [
        [6.8, 0.22, -4.6],
        [2.5, 0.38, -2.2],
        [-1.6, 0.28, 1.1],
        [-6.4, 0.32, 4.6]
      ]),
      makeRoute(world, THREE, mats.routeAqua, [
        [-7.4, 0.28, 3.4],
        [-1.8, 0.42, -0.2],
        [3.2, 0.28, -2.8],
        [8.2, 0.34, 0.6]
      ])
    ];

    [
      [-8.2, -5.2],
      [6.8, -4.6],
      [4.4, 5.1],
      [-6.4, 4.6],
      [8.2, 0.6],
      [-7.4, 3.4]
    ].forEach(([x, z]) => buildHub(world, THREE, mats, x, z));

    const trucks = [
      buildTruck(THREE, mats, 0xff6b1a),
      buildTruck(THREE, mats, 0x00a7a5),
      buildTruck(THREE, mats, 0xf4f6f1)
    ];

    trucks.forEach((truck, index) => {
      truck.userData.route = routes[index].curve;
      truck.userData.offset = index * 0.31;
      truck.userData.speed = 0.045 + index * 0.008;
      truck.scale.setScalar(index === 2 ? 0.82 : 0.92);
      world.add(truck);
    });

    const routeMarkers = routes.map((route, index) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 16, 16),
        index === 1 ? mats.orange : mats.teal
      );
      marker.userData.route = route.curve;
      marker.userData.offset = index * 0.21;
      marker.userData.speed = 0.12 + index * 0.03;
      world.add(marker);
      return marker;
    });

    const pointer = { x: 0, y: 0 };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();

    window.addEventListener("pointermove", (event) => {
      const rect = targetCanvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    const resize = () => {
      const width = targetCanvas.clientWidth || window.innerWidth;
      const height = targetCanvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();

      if (width < 760) {
        camera.position.set(2.8, 7.2, 17.5);
        world.position.set(0, -1.3, -0.6);
        world.scale.setScalar(0.82);
      } else {
        camera.position.set(8.2, 6.4, 14.5);
        world.position.set(2.6, -1.1, 0);
        world.scale.setScalar(1);
      }
    };

    window.addEventListener("resize", resize);
    resize();

    function animate() {
      const elapsed = clock.getElapsedTime();
      const pace = reduceMotion ? 0.35 : 1;

      world.rotation.y = Math.sin(elapsed * 0.08) * 0.035 + pointer.x * 0.025;
      world.rotation.x = -0.03 + pointer.y * 0.012;

      trucks.forEach((truck) => {
        const t = (elapsed * truck.userData.speed * pace + truck.userData.offset) % 1;
        const point = truck.userData.route.getPointAt(t);
        const tangent = truck.userData.route.getTangentAt(t);
        truck.position.copy(point);
        truck.position.y += 0.14;
        truck.rotation.y = Math.atan2(tangent.x, tangent.z);
      });

      routeMarkers.forEach((marker) => {
        const t = (elapsed * marker.userData.speed * pace + marker.userData.offset) % 1;
        marker.position.copy(marker.userData.route.getPointAt(t));
        marker.position.y += 0.42 + Math.sin(elapsed * 4 + marker.userData.offset) * 0.05;
      });

      camera.lookAt(0.6, 0.1, 0);
      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    }

    animate();
  }

  function buildGround(parent, THREE, mats) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 34), mats.ground);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    parent.add(floor);

    const points = [];
    for (let i = -22; i <= 22; i += 2) {
      points.push(-22, 0.012, i, 22, 0.012, i);
      points.push(i, 0.012, -16, i, 0.012, 16);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const grid = new THREE.LineSegments(geometry, mats.grid);
    parent.add(grid);
  }

  function buildRoad(parent, THREE, mats, x, y, z, length, width, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, y + 0.025, z);
    group.rotation.y = rotation;

    const road = new THREE.Mesh(new THREE.PlaneGeometry(width, length), mats.asphalt);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    group.add(road);

    for (let i = -length / 2 + 2; i < length / 2; i += 4) {
      const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.45), mats.lane);
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(0, 0.02, i);
      group.add(lane);
    }

    parent.add(group);
  }

  function buildWarehouse(parent, THREE, mats, x, y, z, scale) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(scale);

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1, 1.55), mats.warehouse);
    base.position.y = 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.24, 1.72), mats.roof);
    roof.position.y = 1.13;
    roof.castShadow = true;
    group.add(roof);

    for (let i = -0.62; i <= 0.62; i += 0.62) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.03), mats.dark);
      door.position.set(i, 0.3, 0.79);
      group.add(door);
    }

    const windowBand = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 0.035), mats.glass);
    windowBand.position.set(0, 0.72, 0.8);
    group.add(windowBand);

    parent.add(group);
  }

  function buildContainerYard(parent, THREE, mats) {
    const colors = [mats.orange, mats.teal, mats.lime, mats.white, mats.roof];
    const positions = [
      [-1.5, -5.8, 0], [-0.25, -5.8, 1], [1, -5.8, 0],
      [-1.15, -4.9, 1], [0.1, -4.9, 0], [1.35, -4.9, 2],
      [-0.6, 5.9, 0], [0.65, 5.9, 1], [1.9, 5.9, 0]
    ];

    positions.forEach(([x, z, stack], index) => {
      for (let level = 0; level <= stack; level += 1) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.52), colors[(index + level) % colors.length]);
        box.position.set(x, 0.24 + level * 0.45, z);
        box.castShadow = true;
        box.receiveShadow = true;
        parent.add(box);
      }
    });
  }

  function buildHub(parent, THREE, mats, x, z) {
    const hub = new THREE.Group();
    hub.position.set(x, 0.08, z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.16, 28), mats.hub);
    base.castShadow = true;
    hub.add(base);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 42), mats.routeAqua);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    hub.add(ring);

    parent.add(hub);
  }

  function makeRoute(parent, THREE, material, coords) {
    const curve = new THREE.CatmullRomCurve3(coords.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.035, 8, false), material);
    tube.position.y = 0.06;
    parent.add(tube);
    return { curve, tube };
  }

  function buildTruck(THREE, mats, bodyColor) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.52, metalness: 0.14 });

    const trailer = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.52, 0.78), bodyMat);
    trailer.position.set(-0.36, 0.48, 0);
    trailer.castShadow = true;
    group.add(trailer);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.58, 0.78), mats.white);
    cab.position.set(0.76, 0.42, 0);
    cab.castShadow = true;
    group.add(cab);

    const window = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.26, 0.48), mats.glass);
    window.position.set(1.08, 0.55, 0);
    group.add(window);

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.88), mats.dark);
    base.position.set(0, 0.17, 0);
    group.add(base);

    [-0.76, -0.18, 0.72].forEach((x) => {
      [-0.48, 0.48].forEach((z) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 22), mats.tire);
        wheel.position.set(x, 0.14, z);
        wheel.rotation.x = Math.PI / 2;
        wheel.castShadow = true;
        group.add(wheel);
      });
    });

    const light = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.42), mats.orange);
    light.position.set(1.09, 0.29, 0);
    group.add(light);

    return group;
  }

  function initCanvasFallback(targetCanvas) {
    targetCanvas.dataset.renderer = "fallback";
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      width = targetCanvas.clientWidth || window.innerWidth;
      height = targetCanvas.clientHeight || window.innerHeight;
      targetCanvas.width = Math.floor(width * dpr);
      targetCanvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#101820";
      ctx.fillRect(0, 0, width, height);

      const horizon = height * 0.58;
      ctx.strokeStyle = "rgba(122, 140, 143, 0.22)";
      ctx.lineWidth = 1;
      for (let i = -width; i < width * 2; i += 46) {
        ctx.beginPath();
        ctx.moveTo(i, height);
        ctx.lineTo(width * 0.5, horizon);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i += 1) {
        const y = horizon + i * i * 5.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      drawRoute(ctx, width * 0.18, height * 0.7, width * 0.82, height * 0.42, "#00d9d2", frame * 0.006);
      drawRoute(ctx, width * 0.72, height * 0.78, width * 0.32, height * 0.38, "#ff7a23", frame * 0.008);
      drawFallbackTruck(ctx, width * 0.55 + Math.sin(frame * 0.025) * 90, height * 0.62, "#ff6b1a");
      drawFallbackTruck(ctx, width * 0.76 + Math.cos(frame * 0.018) * 70, height * 0.5, "#00a7a5");

      window.requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    draw();
  }

  function drawRoute(ctx, startX, startY, endX, endY, color, progress) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(startX + 150, startY - 180, endX - 120, endY + 150, endX, endY);
    ctx.stroke();

    const t = progress % 1;
    const x = startX * (1 - t) + endX * t;
    const y = startY * (1 - t) + endY * t - Math.sin(t * Math.PI) * 120;
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFallbackTruck(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(-72, 24, 154, 12);
    ctx.fillStyle = color;
    ctx.fillRect(-64, -20, 92, 36);
    ctx.fillStyle = "#f4f6f1";
    ctx.fillRect(30, -12, 34, 28);
    ctx.fillStyle = "#70d6d4";
    ctx.fillRect(50, -6, 10, 12);
    ctx.fillStyle = "#0c1014";
    [-42, 12, 54].forEach((wheelX) => {
      ctx.beginPath();
      ctx.arc(wheelX, 22, 10, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
})();
