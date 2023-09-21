import * as THREE from 'three'
import { OrbitControls } from "https:/threejs.org/examples/jsm/controls/OrbitControls.js"
import { GLTFExporter } from "https://threejs.org/examples/jsm/exporters/GLTFExporter.js"
import { parseVXM } from "/js/vxmparser.js"
import ThreeDragger from "dragger"

//import { OBJExporter } from "https://threejs.org/examples/jsm/exporters/objExporter.js"

let camera, scene, renderer, fancyGraphics = false
let plane, ground
let pointer, raycaster, isShiftDown = false
let controls, dragControls

let rollOverMesh, rollOverMaterial
let cubeGeo, cubeMaterial, cubeTex
let placeSound, deleteSound, clearSound, paintSound, audioObjects = []
let moving = false, positionValid = true, dragging = false
let delBox, a, tool, color = "#feb74c", picking = false, pendingChanges = false

const objects = []
let rectHolos = []
let rectXHelper, rectYHelper, rectZHelper, helperGeo, rectStartPos, xFloored = new THREE.Vector3(), yFloored = new THREE.Vector3(), zFloored = new THREE.Vector3(), rectSize = new THREE.Vector3()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
} else {
  alert("This browser doesn't support web workers. You won't be able to use Voxel Painter offline or install it as an app.")
}

var isMobile = false; //initiate as false
// device detection
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
    isMobile = true;
}

if (isMobile) {
  console.log("Device is mobile, adjusting setup accordingly")
}

const beforeUnloadListener = (event) => {
  console.log(pendingChanges)
  if (pendingChanges) {
    event.preventDefault();
    return event.returnValue = "Are you sure you want to exit?";
  }
};
addEventListener("beforeunload", beforeUnloadListener, {capture: true});

function resetCam() {
  let position = {x: camera.position.x, y: camera.position.y, z: camera.position.z}
  let target = {x: 500, y: 800, z: 1300}
  let tween = new TWEEN.Tween(position).to(target, 1500)
  tween.easing(TWEEN.Easing.Cubic.Out)
  tween.onUpdate(function(){
    console.log(camera.position)
    camera.position.x = position.x;
    camera.position.y = position.y;
    camera.position.z = position.z;
    camera.lookAt( 0, 0, 0 )
  });
  tween.onComplete(function() {
    controls.enabled = true
  })
  controls.enabled = false
  tween.start()
}

function disableRect() {
  for (let x in rectHolos) {
        scene.remove(rectHolos[x])
      }
      rectXHelper.visible = false
      rectYHelper.visible = false
      rectZHelper.visible = false
      rectSize.set(0, 0, 0)
      xFloored = new THREE.Vector3(), yFloored = new THREE.Vector3(), zFloored = new THREE.Vector3()
}

function positionCheck(intersects) {
  if (Math.abs(rollOverMesh.position.x) > 500 || Math.abs(rollOverMesh.position.z) > 500 || intersects[0]["object"].name == "helper" || dragging) {
      positionValid = false
      rollOverMesh.visible = false
    }
    else {
      positionValid = true
      rollOverMesh.visible = true
    }
}

function updateHolo() {
  let newXFloored = new THREE.Vector3()
  newXFloored.copy(rectXHelper.position)
  newXFloored.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 )
  let newYFloored = new THREE.Vector3()
  newYFloored.copy(rectYHelper.position)
  newYFloored.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 )
  let newZFloored = new THREE.Vector3()
  newZFloored.copy(rectZHelper.position)
  newZFloored.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 )
  if (newXFloored.x == xFloored.x && newYFloored.y == yFloored.y && newZFloored.z == zFloored.z) {return}
  xFloored.copy(newXFloored)
  yFloored.copy(newYFloored)
  zFloored.copy(newZFloored)

  let xDiff = (xFloored.x - rectStartPos.x) - 50
  let yDiff = (yFloored.y - rectStartPos.y) - 50
  let zDiff = (zFloored.z - rectStartPos.z) - 50
  rectSize.set(xDiff, yDiff, zDiff)
  console.log(rectSize)
  for (let x in rectHolos) {
    scene.remove(rectHolos[x])
  }
  rectHolos = []
  for (let x = rectStartPos.x; x <= newXFloored.x - 50; x+=50) {
    for (let y = rectStartPos.y; y <= newYFloored.y - 50; y+=50) {
      for (let z = rectStartPos.z; z <= newZFloored.z - 50; z+=50) {
        let rectTestCube = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), new THREE.MeshBasicMaterial( { color: 0x999999, opacity: 0.7, transparent: true } ))
        rectTestCube.position.set(x, y, z)
        rectHolos.push(rectTestCube)
        scene.add(rectTestCube)
      }
    }
  }
}

function downloadFile(content, fileName, contentType) {
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    //URL.revokeObjectURL(a.href) (breaks firefox)
}
function download() {
  let content = []
  for (let x in objects) {
    if (objects[x].name == "block") {
      let material
      switch (objects[x].userData["material"]) {
        case "normal":
          material = 0
          break
        case "glass":
          material = 1
          break
        case "glow":
          material = 2
          break
      }
      console.log(objects[x].position)
      content.push({position: objects[x].position.toArray(), color: objects[x].material.color.getHexString(), material: material})
    }
  }
  let name = prompt("Please enter the filename to save as", "build")
  console.log(name)
  if (!(name == null || name == "")) {
      pendingChanges = false
      downloadFile(JSON.stringify(content), name + ".vxm", "text/json")
  }
}
function postToGallery () {
  let content = []
  for (let x in objects) {
    if (objects[x].name == "block") {
      let material
      switch (objects[x].userData["material"]) {
        case "normal":
          material = 0
          break
        case "glass":
          material = 1
          break
        case "glow":
          material = 2
          break
      }
      console.log(objects[x].position)
      content.push({position: objects[x].position.toArray(), color: objects[x].material.color.getHexString(), material: material})
    }
  }
  let name = prompt("Please enter the filename to post as")
  if (name == null || name == "") {
    return
  }
  let form = new FormData()
  form.set("vxm", JSON.stringify(content))
  console.log(form.get("vxm"))
  function tryUpload() {
    document.getElementById("statusbar").style.display = "initial"
    document.getElementById("statusbar").innerText = "Uploading"
    fetch("https://voxel-gallery.gingerindustries.repl.co/upload?title=" + name, {method: "POST", body: form}).then(function(response) {
    console.log(response)
    response.json().then(
      function(data) {
        console.log("c")
        if (data["success"] == false) {
          document.getElementById("statusbar").innerText = "Authenticating"
        let win = window.open("https://voxel-gallery.gingerindustries.repl.co/login?redirect=/upload?uuid=" + data["uuid"] + "&title=" + name)
        console.log(win)
       let t = setInterval(() => {
          if (win.location.pathname != "/login") {
            clearInterval(t)
            document.getElementById("statusbar").style.display = "none"
            document.getElementById("statusbar").innerText = ""
          }
        }, 500)
        }
      }
    )
  })
  }
  tryUpload()
}
function saveAsOBJ() {
  let name = prompt("Please enter the filename to save as", "build")
  for (let x in rectHolos) {
    scene.remove(rectHolos[x])
  }
  disableRect()
  const objExporter = new OBJExporter();
  let result = objExporter.parse(scene, {binary: true})
  downloadFile(result, name + ".obj", "application/octet-stream")
}
function saveAsGLTF() {
  let name = prompt("Please enter the filename to save as", "build")
  if (name == null || name == "") {
    return
  }
  document.getElementById("statusbar").style.display = "initial"
  document.getElementById("statusbar").innerText = "Exporting"
  for (let x in rectHolos) {
    scene.remove(rectHolos[x])
  }
  disableRect()
  const gltfExporter = new GLTFExporter();
  let l = []
  let materialAtlas = []
  for (let x in objects) {
    if (objects[x].name == "block") {
      let o = objects[x]
      console.log(o)
      let foundMat = false
      for (let m in materialAtlas) {
        let mat = materialAtlas[m]
        if (mat.color.equals(o.material.color)) {
          if (mat.userData["material"] == o.userData["material"]) {
            let newMesh = new THREE.Mesh(o.geometry.clone(), mat)
            newMesh.position.copy(o.position)
            l.push(newMesh)
            foundMat = true
            break
          }
        }
      }
      if (!foundMat) {
        let newMat = o.material.clone()
        newMat.userData["material"] = o.userData["material"]
        console.log("m", newMat)
        materialAtlas.push(newMat)
        let newMesh = new THREE.Mesh(o.geometry.clone(), newMat)
        newMesh.position.copy(o.position)
        l.push(newMesh)
      }
    }
  }
  console.log(l)
  gltfExporter.parse(l, function(result) {
    downloadFile(result, name + ".glb", "application/octet-stream")
    document.getElementById("statusbar").style.display = "none"
  }, {binary: true})

}


document.getElementById("file-upload").onchange = function(evt) {
    if(!window.FileReader) return; // Browser is not compatible

    var reader = new FileReader();

    reader.onload = function(evt) {
        if(evt.target.readyState != 2) return;
        if(evt.target.error) {
            alert('Error while reading file');
            return;
        }
        pendingChanges = true

        let objdata = JSON.parse(evt.target.result)
        for (let x in objects) {
          if (objects[x].name == "block") {
            console.log(x)
            scene.remove(objects[x])
          }
        }
        objects.splice(4, objects.length)
        let voxels = parseVXM(objdata, cubeGeo, cubeTex, fancyGraphics)
        for (let vox in voxels) {
          scene.add(voxels[vox])
          objects.push(voxels[vox])
        }
        console.log("Loaded file successfully")
        resetCam()
        
    };

    reader.readAsText(evt.target.files[0]);
};

function sendData(port) {
  let content = []
  for (let x in objects) {
    if (objects[x].name == "block") {
      content.push({position: objects[x].position.toArray(), color: objects[x].material.color.getHexString(), material: 0})
    }
  }
  port.postMessage(content)
  console.log("Transmitted scene info to voxel.ar")
}

window.onmessage = function(e) {
  let port = e.ports[0]
  sendData(port)
}

function enableFancyRendering() {
  document.getElementById("stage").textContent = "Reloading renderer"
  document.getElementById("progressBar").style.display = "none"
  document.getElementById("percent").style.display = "none"
  document.getElementById("loading-wrapper").style.display = "table"
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  plane.material = new THREE.MeshPhongMaterial({color: 0xeeeeee, side: THREE.DoubleSide})
  plane.visible = true
  plane.receiveShadow = true
  for (let obj of objects) {
    if (obj.name == "block") {
      obj.castShadow = true
      obj.receiveShadow = true
    }
  }
  /* This doesn't work very well lol
  scene.traverse(function(obj) {
    if (obj.type == "PointLight") {
      obj.visible = true
    }
  })
  */
  fancyGraphics = true

  document.getElementById("shadows").disabled = false
  document.getElementById("quality").disabled = false
  setTimeout(function() {
    document.getElementById("loading-wrapper").style.display = "none"
  }, 1000)
}
function disableFancyRendering() {
  document.getElementById("stage").textContent = "Reloading renderer"
  document.getElementById("progressBar").style.display = "none"
  document.getElementById("percent").style.display = "none"
  document.getElementById("loading-wrapper").style.display = "table"
  renderer.shadowMap.enabled = false
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  plane.material = new THREE.MeshBasicMaterial({color: 0xeeeeee, side: THREE.DoubleSide})
  plane.receiveShadow = false
  for (let obj of objects) {
    if (obj.name == "block") {
      obj.castShadow = false
      obj.receiveShadow = false
    }
  }
  scene.traverse(function(obj) {
    if (obj.type == "PointLight") {
      obj.visible = false
    }
  })
  fancyGraphics = false

  document.getElementById("shadows").disabled = true
  document.getElementById("quality").disabled = true
  setTimeout(function() {
    document.getElementById("loading-wrapper").style.display = "none"
  }, 1000)
}

init()
render()

function init() {
  // event listeners
  let loadingManager = THREE.DefaultLoadingManager
  loadingManager.onStart = function(url, loaded, total) {
    document.getElementById("stage").innerText = "Loading assets " + String(Math.round((loaded / total) * 100)) + "%"
    let p = document.getElementById("progressBar")
    p.max = 100
    p.value = Math.round((loaded / total) * 100) + 1
    document.getElementById("percent").innerText = String(loaded) + "/" + String(total)
  }
  loadingManager.onProgress = function(url, loaded, total) {
    document.getElementById("stage").innerText = "Loading assets " + String(Math.round((loaded / total) * 100) - 1) + "%"
    let p = document.getElementById("progressBar")
    p.max = 100
    p.value = Math.round((loaded / total) * 100) + 1
    document.getElementById("percent").innerText = String(loaded) + "/" + String(total)
    console.log("Loading " + url)
    //console.log(loaded, total)
  }
  loadingManager.onLoad = function() {
    document.getElementById("stage").innerText = "Done"
    setTimeout(function() {
      setTimeout(function() {
        document.getElementById("loading-wrapper").style.display = "none"
      }, 100)
      tween.start()
    }, 1000)
  }

  a = document.createElement("a");
  let colorChooser = document.getElementById("color")
  colorChooser.addEventListener("change", (event) => {
    color = event.target.value
  }, false);
  document.getElementById("download").addEventListener("click", download)
  document.getElementById("camera-reset").addEventListener("click", () => {
    resetCam()
  })
  document.getElementById("postToGallery").addEventListener("click", postToGallery)
  document.getElementById("downloadGLB").addEventListener("click", saveAsGLTF)
  //document.getElementById("downloadobj").addEventListener("click", saveAsobj)
  document.getElementById("pick").addEventListener("click", () => {
    document.querySelectorAll('input[name="tool"]').forEach((element) => {
      element.disabled = true;
    })
    picking = true
    disableRect()
  })
  document.getElementById("clear").addEventListener("click", () => {
    if (confirm("Clear buildplate?")) {
      clearSound.play()
      pendingChanges = false
      for (let x in objects) {
        if (objects[x].name == "block") {
          console.log(x)
          scene.remove(objects[x])
        }
      }
      objects.splice(4, objects.length)
    }
    
  })
  document.getElementById("viewAR").addEventListener("click", function () {
    let arWin = window.open("https://VoxelAr.gingerindustries.repl.co")
    console.log("Waiting for data request")
  })
  document.getElementById("volume").addEventListener("change", function(e) {
    for (sound of audioObjects) {
      if (sound == placeSound) {
        sound.setVolume(document.getElementById("volume").value)
      }
      else {
        sound.setVolume(document.getElementById("volume").value/2)
      }
      
    }
  })
  document.getElementById("fancy").addEventListener("input", function(e) {
    if (e.target.checked) {
      enableFancyRendering()
    }
    else {
      disableFancyRendering()
    }
  })
  document.getElementById("shadows").addEventListener("click", function(e) {
    renderer.shadowMap.enabled = e.target.checked
  })
  document.getElementById("quality").addEventListener("change", function(e) {
    directionalLight.shadow.map.dispose()
    directionalLight.shadow.map = null
    directionalLight.shadow.mapSize.set(e.target.value, e.target.value)
  })
  document.getElementById("brightness").addEventListener("input", function(e) {
    scene.background.setScalar(e.target.value)
    directionalLight.intensity = e.target.value
  })
  // setup

  cubeTex = new THREE.TextureLoader().load( '/assets/textures/square-outline-textured.png' )

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 20000 )
  //camera.position.set( 500, 800, 1300 )
  camera.lookAt( 0, 0, 0 )
  let listener = new THREE.AudioListener();
  camera.add( listener );

  scene = new THREE.Scene()
  scene.background = new THREE.Color( 0xffffff )

  // audio
  placeSound = new THREE.Audio(listener)
  new THREE.AudioLoader().load("/assets/audio/place.wav", function(buffer) {
    placeSound.setBuffer(buffer)
    placeSound.setVolume(0.5)
    audioObjects.push(placeSound)
  })
  deleteSound = new THREE.Audio(listener)
  new THREE.AudioLoader().load("/assets/audio/delete.wav", function(buffer) {
    deleteSound.setBuffer(buffer)
    deleteSound.setVolume(0.5)
    audioObjects.push(deleteSound)
  })
  clearSound = new THREE.Audio(listener)
  new THREE.AudioLoader().load("/assets/audio/clear.wav", function(buffer) {
    clearSound.setBuffer(buffer)
    clearSound.setVolume(0.25)
    audioObjects.push(clearSound)
  })
  paintSound = new THREE.Audio(listener)
  new THREE.AudioLoader().load("/assets/audio/paint.wav", function(buffer) {
    paintSound.setBuffer(buffer)
    paintSound.setVolume(0.25)
    audioObjects.push(paintSound)
  })
  
  // rect tool helpers
  helperGeo = new THREE.BoxGeometry(25, 25, 25)
  rectXHelper = new THREE.Mesh(helperGeo, new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5, transparent: true}))
  rectYHelper = new THREE.Mesh(helperGeo, new THREE.MeshBasicMaterial({color: 0x00ff00, opacity: 0.5, transparent: true}))
  rectZHelper = new THREE.Mesh(helperGeo, new THREE.MeshBasicMaterial({color: 0x0000ff, opacity: 0.5, transparent: true}))
  rectXHelper.name = "helper"
  rectYHelper.name = "helper"
  rectZHelper.name = "helper"
  rectXHelper.visible = false
  rectYHelper.visible = false
  rectZHelper.visible = false
  scene.add(rectXHelper)
  scene.add(rectYHelper)
  scene.add(rectZHelper)
  objects.push(rectXHelper)
  objects.push(rectYHelper)
  objects.push(rectZHelper)

  // roll-over helpers

  const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 )
  rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } )
  rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial )
  let l = new THREE.PointLight(0xff0000, 0.5)
  //no shadows lol
  //rollOverMesh.add(l)
  if (!fancyGraphics) {
    l.visible = false
  }
  rollOverMesh.visible = false
  scene.add( rollOverMesh )

  // cubes

  cubeGeo = new THREE.BoxGeometry( 50, 50, 50 )
  cubeMaterial = new THREE.MeshStandardMaterial( { color: 0xfeb74c, map: cubeTex } )

  // grid

  const gridHelper = new THREE.GridHelper( 1000, 20 )
  scene.add( gridHelper )

  //ground

  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()

  const geometry = new THREE.PlaneGeometry( 1000, 1000 )
  geometry.rotateX( - Math.PI / 2 )

  plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xeeeeee, side: THREE.DoubleSide} ) )
  scene.add( plane )
  plane.position.setY(-0.3)

  objects.push( plane )

  // lights

  const ambientLight = new THREE.AmbientLight( 0x606060 )
  scene.add( ambientLight )

  const directionalLight = new THREE.DirectionalLight( 0xffffff )
  directionalLight.position.set( 500, 500, 500 )
  directionalLight.castShadow = true
  directionalLight.shadow.camera.far = 3000
  directionalLight.shadow.camera.left = -750
  directionalLight.shadow.camera.bottom = -750
  directionalLight.shadow.camera.right = 750
  directionalLight.shadow.camera.top = 750

  //scene.add(new THREE.CameraHelper(directionalLight.shadow.camera))
  scene.add( directionalLight )

  renderer = new THREE.WebGLRenderer( { antialias: true } )
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  document.body.appendChild( renderer.domElement )

  controls = new OrbitControls(camera, renderer.domElement)
  controls.minDistance = 1606
  controls.enablePan = false
  controls.addEventListener( "start", () => {moving = true})
  controls.addEventListener( "end", () => {moving = false})
  controls.enabled = false

  let position = {x: -10000, y: 3200, z: 7000}
  let target = {x: 500, y: 800, z: 1300}
  let tween = new TWEEN.Tween(position).to(target, 1650)
  tween.easing(TWEEN.Easing.Cubic.Out)
  tween.onUpdate(function(){
    camera.position.x = position.x;
    camera.position.y = position.y;
    camera.position.z = position.z;
    camera.lookAt( 0, 0, 0 )
  });
  tween.onComplete(function() {
    controls.enabled = true
  })
  

  dragControls = new ThreeDragger([rectXHelper, rectYHelper, rectZHelper], camera, renderer.domElement);
  dragControls.on('dragstart', (data) => {controls.enableRotate = false; dragging = true}
  );
  dragControls.on('dragend', (data) => {controls.enableRotate = true; dragging = false; }
  );
  dragControls.on("drag", function(data) {
    const {target,position} = data
    switch (target) {
      case rectXHelper:
        target.position.setX(position.x)
        break
      case rectYHelper:
        target.position.setY(position.y)
        break
      case rectZHelper:
        target.position.setZ(position.z)
        break

    }
    updateHolo()
  })

  renderer.domElement.addEventListener( 'pointermove', onPointerMove )
  renderer.domElement.addEventListener( 'pointerdown', onPointerDown )
  document.addEventListener( 'keydown', onDocumentKeyDown )
  document.addEventListener( 'keyup', onDocumentKeyUp )
  
  delBox = document.getElementById("delete")
  delBox.addEventListener("change", () => {isShiftDown = delBox.checked})
  //

  window.addEventListener( 'resize', onWindowResize )
  let uuid = new URLSearchParams(document.location.search).get("uuid")
  console.log(uuid)
  if (uuid) {
    document.getElementById("statusbar").style.display = "initial"
    document.getElementById("statusbar").innerText = "Loading model"
    fetch("https://voxel-gallery.gingerindustries.repl.co/api/get/" + uuid).then(function(response) {
      response.json().then(function(data) {
        let voxels = parseVXM(data["data"], cubeGeo, cubeTex, fancyGraphics)
        for (let vox in voxels) {
          scene.add(voxels[vox])
          objects.push(voxels[vox])
        }
        document.getElementById("statusbar").style.display = "none"
      })
    })
  }
  console.log("Loading complete")

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize( window.innerWidth, window.innerHeight )

}

function onPointerMove( event ) {
  if (!picking) {
    if (tool == "paint" || tool == "fill-color") {
      rollOverMesh.material.setValues({color: color})
    }
    else {
      rollOverMesh.material.setValues({color: 0xff0000})
    }
  }
  if (!moving && !isMobile) {

  pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 )

  raycaster.setFromCamera( pointer, camera )

  const intersects = raycaster.intersectObjects( objects )

  if ( intersects.length > 0 ) {
    controls.enableRotate = false

    const intersect = intersects[ 0 ]
    if (picking && intersect["object"].name == "block") {
      rollOverMesh.material.setValues({color: intersect["object"].material.color})
    }
    else if (picking) {
       rollOverMesh.material.setValues({color: 0x888888})
    }

    rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal )
    rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 )
    rollOverMesh.visible = true
    positionCheck(intersects)

  }
  else {
    rollOverMesh.visible = false
    controls.enableRotate = true
  }
  }
  

}

function onPointerDown( event ) {

  pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 )

  raycaster.setFromCamera( pointer, camera )

  const intersects = raycaster.intersectObjects( objects )
  if (intersects[0]) {
    if (intersects[0]["object"].name == "helper") {
      return
    }
  }
  

  if ( intersects.length > 0 ) {
    pendingChanges = true

    const intersect = intersects[ 0 ]

    // delete cube
    if (picking && intersect["object"].name == "block") {
      document.getElementById("color").value = "#" + intersect["object"].material.color.getHexString()
      color = "#" + intersect["object"].material.color.getHexString()
      picking = false
      document.querySelectorAll('input[name="tool"]').forEach((element) => {
        element.disabled = false;
      })
      rollOverMesh.material.setValues({color: 0xff0000})
      return
    }
    else if (picking) {
      picking = false
      document.querySelectorAll('input[name="tool"]').forEach((element) => {
        element.disabled = false;
      })
      rollOverMesh.material.setValues({color: 0xff0000})
      return
    }

    if ( isShiftDown ) {

      if ( intersect.object !== plane ) {
        deleteSound.play()

        scene.remove( intersect.object )

        objects.splice( objects.indexOf( intersect.object ), 1 )

      }

      // create cube

    } else if (positionValid) {
      let material = document.querySelector('input[name="material"]:checked').value
      console.log(tool, material)
      let mat
      switch (material) {
        case "normal":
          mat = new THREE.MeshStandardMaterial( { color: color, map: cubeTex, bumpMap: cubeTex } )
          break
        case "glass":
          mat = new THREE.MeshStandardMaterial( { color: color, opacity: 0.5, transparent: true })
          break
        case "glow":
          mat = new THREE.MeshStandardMaterial( { color: color, map: cubeTex, emissive: color} )
          break
      }
      switch (tool) {
        case "pen":
          placeSound.play()
          const voxel = new THREE.Mesh( cubeGeo, mat.clone() )
          voxel.userData = {material: material}
          if (material != "glass") { // Best hack I have, at least until this gets implemented
            voxel.castShadow = fancyGraphics  
            voxel.receiveShadow = fancyGraphics
          }
          if (voxel.userData.material == "glow") {
            let l = new THREE.PointLight(color, 0.5)
            voxel.add(l)
            if (!fancyGraphics) {
              l.visible = false
            }
          }
          voxel.name = "block"
          voxel.position.copy( intersect.point ).add( intersect.face.normal )
          voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 )
          scene.add( voxel )
          objects.push( voxel )
          break
        case "paint":
          paintSound.play()
          let ob = intersect["object"]
          let col = new THREE.Color()
          col.copy(color)
          if (ob.name == "block") {
            ob.userData["material"] = material
            ob.material.copy(mat)
            ob.material.needsUpdate = true
            ob.material.map.needsUpdate = true
          }
          break
        case "fill-color":
          let o = intersect["object"]
          if (o.name == "block") {
            paintSound.play()
            let toChange = []
            let color = null
            for (let i in objects) {
              if (objects[i].name == "block" && o.material.color.equals(objects[i].material.color)) {
                toChange.push(objects[i])
              }
            }
            for (obj of toChange) {
              obj.material.setValues({color: color})
            }
          }
          break
        case "rect":
          if (rectSize.x + rectSize.y + rectSize.z == 0) { 
            disableRect()
            rectStartPos = new THREE.Vector3()
            rectStartPos.copy(intersect.point)
            rectStartPos.add(intersect.face.normal)
            rectStartPos.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 )
            console.log(rectStartPos)


            rectXHelper.position.copy(rectStartPos)
            rectXHelper.position.add(new THREE.Vector3(50, 0, 0))
            rectXHelper.visible = true
            rectYHelper.position.copy(rectStartPos)
            rectYHelper.position.add(new THREE.Vector3(0, 50, 0))
            rectYHelper.visible = true
            rectZHelper.position.copy(rectStartPos)
            rectZHelper.position.add(new THREE.Vector3(0, 0, 50))
            rectZHelper.visible = true
            updateHolo()
          }
          else {
            placeSound.play()
            let positions = []
            for (let n in objects) {
              if (objects[n].name == "block") {
                positions.push(objects[n].position.toArray())
              }
            }
            console.log(positions)
            for (let x = rectStartPos.x; x <= xFloored.x - 50; x+=50) {
              for (let y = rectStartPos.y; y <= yFloored.y - 50; y+=50) {
                for (let z = rectStartPos.z; z <= zFloored.z - 50; z+=50) {
                  let valid = true
                  if ((x == rectStartPos.x || x == xFloored.x - 50) || (y == rectStartPos.y || y == yFloored.y - 50) || (z == rectStartPos.z || z == zFloored.z - 50)) {
                    valid = true
                  }
                  else {
                    valid = false
                  }
                  for (let n in positions) {
                    if (new THREE.Vector3().fromArray(positions[n]).equals(new THREE.Vector3(x, y, z))) {
                      valid = false
                    }
                  }
                  if (valid) {
                    const voxel = new THREE.Mesh( cubeGeo, mat.clone() )
                    voxel.userData = {material: material}
                    voxel.name = "block"
                    voxel.position.set(x, y, z)
                    scene.add( voxel )
                    objects.push( voxel )
                  }
                }
              }
            }
            disableRect()
          }
          break
      }
    }


  }
  else {
    if (picking) {
      picking = false
      document.querySelectorAll('input[name="tool"]').forEach((element) => {
        element.disabled = false;
      })
      rollOverMesh.material.setValues({color: 0xff0000})
      return
    }
      disableRect()
    }
  
}

function onDocumentKeyDown( event ) {

  switch ( event.keyCode ) {

    case 16: isShiftDown = true; delBox.checked = true; break

  }

}

function onDocumentKeyUp( event ) {

  switch ( event.keyCode ) {

    case 16: isShiftDown = false; delBox.checked = false;break

  }

}
function render() {
  requestAnimationFrame(render)
  renderer.render( scene, camera )
  TWEEN.update()
  controls.update()
  tool = document.querySelector('input[name="tool"]:checked').value
  if (tool != "rect" && rectHolos.length > 0) {
    for (let x in rectHolos) {
      scene.remove(rectHolos[x])
    }
    rectXHelper.visible = false
    rectYHelper.visible = false
    rectZHelper.visible = false
  }
  

}