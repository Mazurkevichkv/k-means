function kMeans ({ clustersCount = 10, elementsCount = 500, autoMode = false }) {
    const width = window.innerWidth - 50,
          height = window.innerHeight - 50,
          depth = 1000;
    let clusterizationCounter = 30;
    const canvas = document.getElementById('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setClearColor(0x000000);
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 0);
    const controls = new THREE.OrbitControls( camera );
    camera.position.set(0, 0, depth);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 0, depth);
    scene.add(ambientLight);
    scene.add(pointLight);

    const elementMeshes = createElements();
    const centroidMeshes = createCentroids();
    scene.add(...elementMeshes, ...centroidMeshes);



    function createElements () {
        const elementMeshes = [];
        for (let i = 0; i < elementsCount; i++) {
            let mesh = createCubeMesh();
            setRandomPosition(mesh);
            elementMeshes.push(mesh);
        }
        return elementMeshes;
    }

    function createCentroids () {
        const centroidMeshes = [];
        for (let i = 0; i < clustersCount; i++) {
            const color = [ Math.random(), Math.random(), Math.random() ];
            const mesh = createSphereMesh(color);
            setRandomPosition(mesh);
            centroidMeshes.push(mesh);
        }
        return centroidMeshes;
    }

    function createSphereMesh (color = [ 0.5, 0.5, 0.5 ], radius = 15, widthSegments = 12, heightSegments = 12) {
        const geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments );
        const material = new THREE.MeshLambertMaterial();
        material.color.setRGB(...color);
        return new THREE.Mesh(geometry, material);
    }

    function createCubeMesh (color = [ 0.5, 0.5, 0.5 ], height = 13, width = 13, depth = 13) {
        const geometry = new THREE.BoxGeometry(height, width, depth);
        const material = new THREE.MeshLambertMaterial({ wireframe: true });
        material.color.setRGB(color[0], color[1], color[2]);
        return new THREE.Mesh(geometry, material);
    }

    function setRandomPosition (mesh) {
        mesh.position.x = Math.random() * width - width / 2;
        mesh.position.y = Math.random() * height - height / 2;
        mesh.position.z = Math.random() * depth - depth / 3 * 2;
    }

    let clusters;

    setTimeout(kMeansIteration, 1000);

    if (!autoMode) {
        document.getElementById('nextButton').onclick = kMeansIteration;
    }

    function kMeansIteration () {
        if (clusterizationCounter > 0) {
            clusters = clusterize();
            setCentroidsPositions();
        }
    }

    (function loop () {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    })();

    function setCentroidsPositions () {
        for (let i = 0; i < clustersCount; i++) {
            const elementMeshes = clusters[i];
            let x = 0,
                y = 0,
                z = 0;

            for (let j = 0; j < elementMeshes.length; j++) {
                x += elementMeshes[j].position.x;
                y += elementMeshes[j].position.y;
                z += elementMeshes[j].position.z;
            }
            x = x / elementMeshes.length;
            y = y / elementMeshes.length;
            z = z / elementMeshes.length;
            animateChangePosition(centroidMeshes[i], centroidMeshes[i].position, { x, y, z });
        }

        function animateChangePosition(mesh, startPosition, targetPosition) {
            const speed = document.getElementById('speed').value;
            const eps = 10;
            const {x, y, z} = startPosition;

            const dist = getRawDistance(startPosition, targetPosition);
            const steps = dist / speed;
            if (dist < eps) {
                if (autoMode) {
                    if (clusterizationCounter > 0) {
                        requestAnimationFrame(kMeansIteration)
                    }
                }
                return;
            } else {
                mesh.position.x += (targetPosition.x - x) / steps;
                mesh.position.y += (targetPosition.y - y) / steps;
                mesh.position.z += (targetPosition.z - z) / steps;
                requestAnimationFrame(() => {
                    animateChangePosition(mesh, startPosition, targetPosition);
                })
            }
        }
    }

    function clusterize () {
        clusterizationCounter--;
        const clusters = new Array(clustersCount);
        for (let i = 0; i < clustersCount; i++) {
            clusters[i] = [];
        }

        for (let i = 0; i < elementMeshes.length; i++) {
            const elementMesh = elementMeshes[i];
            let clusterIndex = 0;
            let minDistance = Number.MAX_SAFE_INTEGER;

            for (let j = 0; j < centroidMeshes.length; j++) {
                const currDistance = getDistance(elementMesh, centroidMeshes[j]);
                if (currDistance < minDistance) {
                    minDistance = currDistance;
                    clusterIndex = j;
                }
            }

            elementMesh.material.color = centroidMeshes[clusterIndex].material.color;
            clusters[clusterIndex].push(elementMesh);
        }

        return clusters;
    }



    function getDistance (meshA, meshB) {
        return Math.sqrt(
            Math.pow(Math.sqrt(
                Math.pow( meshA.position.x - meshB.position.x, 2) +
                Math.pow(meshA.position.y - meshB.position.y, 2)
            ), 2) +
            Math.pow(meshA.position.z - meshB.position.z, 2)
        );
    }

    function getRawDistance (pointA, pointB) {
        return Math.sqrt(
            Math.pow(Math.sqrt(
                Math.pow(pointA.x - pointB.x, 2) +
                Math.pow(pointA.y - pointB.y, 2)
            ), 2) +
            Math.pow(pointA.z - pointB.z, 2)
        );
    }
}

function start() {
    const clustersCount = parseInt(document.getElementById('clustersCountInput').value);
    const elementsCount = parseInt(document.getElementById('elementsCountInput').value);
    const autoMode = document.getElementById('auto-mode').checked;
    kMeans({ clustersCount, elementsCount, autoMode });
}
