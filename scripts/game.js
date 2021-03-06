
class Game {

  KRYPTONITE_BUFF = new THREE.BoxBufferGeometry(1, 1, 1);
  KRYPTONITE_MAT = new THREE.MeshPhysicalMaterial({
    transmission: 0.5,
    thickness: 1.5,
    roughness: 0.07,
    color: 0x08FF08,
  })
  BONUS_BUFF = new THREE.SphereBufferGeometry(1, 12, 12);
  BONUS_MAT = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });

  collisionTemp = null;

  pause = false;

  //scene is ready
  supermanReady = false;
  moonReady = false;

  //animation variables
  fluct = true;
  supUp = true;
  rightArmUp = true;
  rightArmDown = false;
  leftArmUp = true;
  leftArmDown = false;
  cape = null;
  shake = false;
  shake_count = 20;
  rightArm = null;
  leftArm = null;

  //moon animation variables
  moonSize = 30;
  moonY = -31;
  moonRotationSpeed = 0.001;

  constructor(scene, camera, difficulty) {

    this.speedZ = difficulty; //objects speed
    this.time = 0;
    this.clock = new THREE.Clock();
    this.initializeScene(scene, camera);

    this.health = 100;
    this.score = 0;
    this.distance = 0;

    this.divHealth = document.getElementById('health')
    this.divScore = document.getElementById('score')
    this.divDistance = document.getElementById('distance')

    this.divScore.innerText = "Score: " + this.score
    this.divDistance.innerText = "Distance: " + this.distance
    this.divHealth.value = this.health

    document.addEventListener('keydown', this.keydown.bind(this));
  }

  update() {

    if (this.moonReady && this.supermanReady && !this.pause) {
      this.checkCollisions();
      this.checkGameOver()
      this.time += this.clock.getDelta()

      this.updateObjects();
      this.animate();
      this.distance += 1;
      this.divDistance.innerText = "Distance: " + this.distance;
    }
  }

  keydown(event) {

    switch (event.key) {
      case 'ArrowLeft':

        if (this.superman.position.x > -3) {
          this.superman.translateX(+0.2);
          this.supermanBB.setFromObject(this.superman)
        }
        break;

      case 'ArrowRight':

        if (this.superman.position.x < 3) {
          this.superman.translateX(-0.2);
          this.supermanBB.setFromObject(this.superman)
        }
        break;

      case 'r':

        if (this.rightArm.rotation.z < 1.03) this.rightArmUp = true
        else if (this.rightArm.rotation.z > 4) this.rightArmDown = true;
        break;

      case 'l':

        if (this.leftArm.rotation.z > - 1.05) this.leftArmUp = true
        else if (this.leftArm.rotation.z < -4) this.leftArmDown = true;
        break;

      case 'ArrowUp':

        if (this.moonSize > 10) {
          this.moonSize--;
          this.moonY++;
          this.moon.scale.set(this.moonSize, this.moonSize, this.moonSize);
          this.moon.position.y = this.moonY;
        }
        break;

      case 'ArrowDown':

        if (this.moonSize < 31) {
          this.moonSize++;
          this.moonY--;
          this.moon.scale.set(this.moonSize, this.moonSize, this.moonSize);
          this.moon.position.y = this.moonY;
        }
        break

      case 'p':

        this.pause = !this.pause;
        break

      case 'm':

        this.moonRotationSpeed += 0.001;
        break
    }

  }

  updateObjects() {
    //TOD0 remove 0 inside params

    this.objectsGroup.position.z = this.speedZ * this.time; //move objects 
    var count = 0;//count objects inside bounding box array 
    this.objectsGroup.traverse((child) => { //iterate over all the objects
      if (child instanceof THREE.Mesh) {

        this.objectsBB[count].setFromObject(child);//update boundingbox
        count++;

        const childZPos = child.position.z + this.objectsGroup.position.z;

        if (childZPos > 0) {
          const params = [child, 0, -this.objectsGroup.position.z]; //reset objects position (0 is temporary)
          if (child.userData.type === 'kryptonite') {
            this.setKryptonite(...params);
          }
          else {//it's a bonus
            this.setBonus(...params);
          }
        }
      }
    });

  }

  initializeScene(scene, camera) {

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 5, 3);
    scene.add(light);

    const lightAmbient = new THREE.AmbientLight(0xffffff, 1);
    lightAmbient.position.set(0, 0, 0);
    scene.add(lightAmbient);

    const galaxyGeometry = new THREE.SphereGeometry(200, 200, 200);
    const galaxyMaterial = new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("img/sky_stars.jpeg"),
      side: THREE.BackSide,
    });
    this.galaxyMesh = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    scene.add(this.galaxyMesh);

    this.moon = this.modelLoad('gltf/moon_scene.gltf')
    Promise.resolve(this.moon).then((data) => {
      this.moon = data;
      this.moon.scale.set(30, 30, 30);
      this.moon.position.z = -3;
      this.moon.position.y = -31
      scene.add(this.moon)

      this.moonReady = true;
    })

    this.superman = this.modelLoad('gltf/superman_scene.gltf')
    Promise.resolve(this.superman).then((data) => {
      this.superman = data;
      this.cape = this.superman.getObjectByName("Cape1_052")
      this.rightArm = this.superman.getObjectByName("RBicep_030")
      this.leftArm = this.superman.getObjectByName("LBicep_07")

      this.superman.scale.set(0.01, 0.01, 0.01)
      this.superman.rotateY(180 * Math.PI / 180);
      this.superman.rotateX(45 * Math.PI / 180)
      this.superman.position.y -= 0.9;

      this.cape.rotation.x = (125 * Math.PI / 180)
      this.cape.rotation.z = (-10 * Math.PI / 180)
      this.cape.rotation.y = (10 * Math.PI / 180)

      scene.add(this.superman)

      this.supermanBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(this.superman);
      this.supermanReady = true;
    })

    this.objectsGroup = new THREE.Group();
    this.objectsBB = new Array();

    scene.add(this.objectsGroup);

    let i = 0;
    for (i = 0; i < 5; i++) {
      this.createKryptonite();
      this.createBonus();
    }

    camera.position.set(0, 1.5, 3);
  }

  createKryptonite() {

    const obj = new THREE.Mesh(this.KRYPTONITE_BUFF, this.KRYPTONITE_MAT);

    obj.applyMatrix(new THREE.Matrix4().makeRotationZ(Math.PI / 4));//model cube like a 'gem' of kryptonite
    obj.applyMatrix(new THREE.Matrix4().makeScale(1, 2, 1));

    this.setKryptonite(obj)

    const kryptoniteBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(obj);
    kryptoniteBB.userData = { type: 'kryptonite' };
    this.objectsBB.push(kryptoniteBB);

    this.objectsGroup.add(obj);
    obj.userData = { type: 'kryptonite' };
  }

  setKryptonite(obj, refXPos = 0, refZPos = 0) {

    let scale = this.randomFloat(0.3, 0.8)
    obj.scale.set(scale, scale, scale)
    obj.position.set(
      refXPos + this.randomFloat(-3, 3),
      obj.scale.y,
      refZPos - 100 - this.randomFloat(0, 100)
    );

  }

  createBonus() {

    const obj = new THREE.Mesh(this.BONUS_BUFF, this.BONUS_MAT);
    this.setBonus(obj);
    const bonusBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(obj);
    bonusBB.userData = { type: 'bonus' };
    this.objectsBB.push(bonusBB);

    this.objectsGroup.add(obj);
    obj.userData = { type: 'bonus' };
  }

  setBonus(obj, refXPos = 0, refZPos = 0) {

    const size = this.randomFloat(0.3, 0.5);
    obj.scale.set(size, size, size);
    obj.position.set(
      refXPos + this.randomFloat(-3, 3),
      obj.scale.y,
      refZPos - 100 - this.randomFloat(0, 100)
    );
  }

  randomFloat(min, max) { return Math.random() * (max - min) + min; }
  randomInt(min, max) {

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  checkCollisions() {

    this.objectsBB.forEach(element => {
      if (this.supermanBB.intersectsBox(element) && element != this.collisionTemp) {
        this.collisionTemp = element;
        if (element.userData.type === 'kryptonite') {
          this.health -= 10;
          this.divHealth.value = this.health;
          this.shake = true;
        }
        else {
          this.score += 10;
          this.divScore.innerHTML = "Score: " + this.score;
        }
      }
    });
  }


  modelLoad(gltfFile) {

    const myPromise = new Promise((resolve, reject) => {
      const gltfLoader = new THREE.GLTFLoader();
      gltfLoader.load(
        gltfFile,
        function (gltf) {
          resolve(gltf.scene);
        },
        function (xhr) {
          // console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
        },
        function (error) {
          // console.log("An error happened");
          reject(error);
        }
      )
    })
    return myPromise;
  }

  animate() {
    this.galaxyMesh.rotation.x += 0.0005;
    this.moon.rotateX(this.moonRotationSpeed);

    // superman go from bottom to starting point
    if (this.supUp) {
      if (this.superman.position.y <= 0)
        this.superman.position.y += 0.01;
      else this.supUp = false
    }
    //___________________
    //right arm controls
    //raise arm 
    if (this.rightArmUp) {
      if (this.rightArm.rotation.z <= 4) {
        this.rightArm.rotation.z += 0.1;
        this.rightArm.rotation.x -= 0.03;
      }
      else {
        this.rightArmUp = false;
      }
    }
    //down arm
    if (this.rightArmDown) {
      if (this.rightArm.rotation.z > 1.1) {
        this.rightArm.rotation.z -= 0.1;
        this.rightArm.rotation.x += 0.03;
      }
      else {
        this.rightArmDown = false;

      }
    }
    //left arm controls
    //raise arm 
    if (this.leftArmUp) {
      if (this.leftArm.rotation.z >= -4) {
        this.leftArm.rotation.z -= 0.1;
        this.leftArm.rotation.x -= 0.03;
      }
      else {
        this.leftArmUp = false;
      }
    }
    //down arm
    if (this.leftArmDown) {
      if (this.leftArm.rotation.z < -1.1) {
        this.leftArm.rotation.z += 0.1;
        this.leftArm.rotation.x += 0.03;
      }
      else {
        this.leftArmDown = false;

      }
    }

    //fluctuate
    if (this.fluct) {
      if (this.superman.position.y <= 0.03) {
        this.superman.position.y += 0.002;
        this.cape.rotation.y -= 0.004;
      }
      else {
        this.fluct = false;
      }
    }
    else {
      if (this.superman.position.y >= -0.03) {
        this.superman.position.y -= 0.002;
        this.cape.rotation.y += 0.004;
      }
      else {
        this.fluct = true;
      }
    }
    //_____________________________

    //shake animation
    if (this.shake && this.shake_count > 0) {
      if (this.shake_count % 2 == 0) {
        this.superman.position.x -= 0.5;
      }
      else {
        this.superman.position.x += 0.5;
      }
      this.shake_count--;
    }
    else {
      this.shake_count = 20;
      this.shake = false;
    }

    //________________
    /*LShank_064 LEFT KNEE TO FOOT
      Spine_03 HIP TO UP
      LThigh_063 LEFT LEG
      RThigh_066 RIGHT LEG
      LBicep_07  LEFT ARM 
      RBicep_030 RIGHT ARM
      Cape1_052 CAPE
    */
  }

  checkGameOver() {

    if (this.divHealth.value < 10) {
      alert("Game Over` \npress ok to reload");
      this.divHealth.value = 10;
      window.location.reload();
    }
  }
}