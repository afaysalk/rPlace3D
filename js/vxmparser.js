import * as THREE from 'three'

function parseVXM (objdata, cubeGeo, cubeTex, fancyGraphics = false, scale = false) {
  let voxels = []
  for (let x in objdata) {
    let color = "#" + objdata[x]["color"]
    let mat
    switch (objdata[x]["material"]) {
      case 0:
        mat = new THREE.MeshStandardMaterial( { color: color, map: cubeTex, bumpMap: cubeTex} )
        break
      case 1:
        mat = new THREE.MeshStandardMaterial( { color: color, opacity: 0.5, transparent: true })
        break
      case 2:
        mat = new THREE.MeshStandardMaterial( { color: color, map: cubeTex, emissive: color} )
        break
      default:
        mat = new THREE.MeshStandardMaterial( { color: color, map: cubeTex, bumpMap: cubeTex } )
        break
    }

    let voxel = new THREE.Mesh( cubeGeo, mat)
    if (objdata[x]["material"]) {
      voxel.userData = {material: {0: "normal", 1: "glass", 2: "glow"}[objdata[x]["material"]]}
    }
    else {
      voxel.userData = {material: "normal"}
    }
    if (voxel.userData.material != "glass") { // Best hack I have, at least until this gets implemented
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
    let pos = objdata[x]["position"]
    if (scale) {
      voxel.position.set(pos[0]/200, pos[1]/200, pos[2]/200)
    }
    else {
      voxel.position.fromArray(objdata[x]["position"])
    }
    voxels.push(voxel)
  }
  return voxels
}

export { parseVXM }         