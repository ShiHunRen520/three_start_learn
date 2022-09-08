<template>
  <div class="space">
    <!-- 地图挂载空间 -->
    <div id="con"></div>
  </div>
</template>

<script>
import * as t from "three"
import {
  MapControls
} from "three/examples/jsm/controls/OrbitControls"
// 墨卡托坐标转换工具库
import * as geolib from 'geolib'
// 检测工具
import Stats from 'three/examples/jsm/libs/stats.module'
// 优化工具
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js"
export default {
  name: 'space',
  props: {},
  data () {
    return {
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      geolib: null,
      // 南京玄武
      center: [118.9212649, 32.1079764],
      // 五河城南
      // center: [117.868563,33.1284668],
      materialBuilding: null,
      btn1Value: ['白模', '随机色'],
      isBtn: true,
      stats: null,
      // geometries
      geometries: [],
      // helpers
      collider_building: []
    }
  },
  mounted () {
    this.init()
    // 检测屏幕分辨率进行自适应
    window.addEventListener('resize', () => {
      if (this.scene) {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
      }
    }, false)
    // 光线投射选取三维世界物体
    let mouse = new t.Vector2()
    let raycaster = new t.Raycaster()
    document.getElementById("con").addEventListener("click", () => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      // 更新新世界矩阵
      this.scene.updateMatrixWorld(true);
      // 更新射线
      raycaster.setFromCamera(mouse, this.camera)
      // 与射线相交的模型 参数1 检测对象，参数2是否检测该对象
      let intersects = raycaster.intersectObjects(this.collider_building, true)
      const res = intersects.filter(res => res && res.object)[0];
      if (res && res.object) {
        // console.log("选中啦")
        console.log(res.object.name, 'ssss')
        console.log(res.object, 'object')
        alert(res.object.name)
        if (res.object.position.x === 9.092048645019531) {
          alert('公司聚会园')
        }
        // res.object.material.color.r = Math.random()
        // res.object.material.wireframe = true
      }
    }, false)
  },
  methods: {
    // 三维场景初始化
    init () {
      let con = document.getElementById('con')
      // gridhelper
      let gridhelper = new t.GridHelper(160, 60, new t.Color(0x555555), new t.Color(0x333333))
      // scene
      this.scene = new t.Scene()
      console.log(this.scene)
      this.scene.background = new t.Color(0x222222)
      this.scene.add(gridhelper)
      // camera
      this.camera = new t.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000)
      this.camera.position.set(12, 20, 0)
      // this.scene.add(this.camera)
      // light
      let light0 = new t.AmbientLight(0xfafafa, 0.25)
      let light1 = new t.PointLight(0xfafafa, 0.4)
      light1.position.set(200, 90, 40)
      let light2 = new t.PointLight(0xfafafa, 0.4)
      light2.position.set(200, 90, -40)

      this.scene.add(light0)
      this.scene.add(light1)
      this.scene.add(light2)

      // let geo = new t.BoxGeometry(5, 2, 2)
      // let m = new t.MeshBasicMaterial({
      // 	color: 0x754862
      // })
      // let mesh = new t.Mesh(geo, m)
      // this.scene.add(mesh)

      // renderer
      this.renderer = new t.WebGLRenderer({
        antialias: true
      })
      this.renderer.setPixelRatio(window.devicePixelRatio)
      this.renderer.setSize(window.innerWidth, window.innerHeight)

      con.appendChild(this.renderer.domElement)

      // controls
      this.controls = new MapControls(this.camera, this.renderer.domElement)

      this.controls.update()

      this.Update()
      this.materialBuilding = new t.MeshPhongMaterial({
        // color: 0x754862
        color: 0xffffff
      })
      this.getGeoJson()
      this.stats = new Stats()
      this.stats.update()
      console.log(this.stats, 'pppppp')
      con.appendChild(this.stats.domElement)

    },
    // 根据浏览器刷新率，进行三维空间更新
    Update () {
      requestAnimationFrame(this.Update)
      // this.stats.update()
      this.renderer.render(this.scene, this.camera)
      this.controls.update()
    },
    // 获得地图的 地理信息geojson数据
    getGeoJson () {
      fetch("./assets/xuanwu_way.geojson").then(res => {
        res.json().then(data => {
          console.log(data)
          this.loadBuilding(data)
        })
      })
    },
    // 加载和处理获得到 geojson数据
    loadBuilding (data) {
      let features = data.features
      for (let i = 0; i < features.length; i++) {
        let fea = features[i]
        if (!fea["properties"]) return
        let info = fea.properties
        if (info["building"]) {
          this.addBuilding(fea.geometry.coordinates, info, info["building:levels"])
        } else if (info['highway']) {
          // if(fea.geometry.type === "LineString" && info["highway"] != "pedestring" && info["highway"] != "footway" && info["highway"] != "path")
          // 上面是 只选取部分路线
          if (fea.geometry.type === "LineString") {
            this.addRoad(fea.geometry.coordinates, info)
          }
        }
      }
      // 为每一个 模型 赋值材质
      let buildMaterial = new t.MeshPhongMaterial({
        color: 0xffffff * Math.random(),
        // color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        wireframe: true
      })
      let that = this
      this.$nextTick(() => {
        let mergeGeometry = BufferGeometryUtils.mergeBufferGeometries(that.geometries)
        let mesh = new t.Mesh(mergeGeometry, buildMaterial)
        that.scene.add(mesh)
      })
    },
    // 加上路函数
    addRoad (data, info) {
      let points = []
      for (let i = 0; i < data.length; i++) {
        if (!data[0][1]) return
        let el = data[i]
        if (!el[0] || !el[1]) return
        let elp = [el[0], el[1]]
        elp = this.GPSRelativePosition([elp[0], elp[1]], this.center)
        points.push(new t.Vector3(elp[0], 0.5, elp[1]))
      }
      let geometry = new t.BufferGeometry().setFromPoints(points)
      geometry.rotateZ(Math.PI)
      let MAT_ROAD = new t.LineBasicMaterial({ color: 0xffff00 })
      let line = new t.Line(geometry, MAT_ROAD)
      this.scene.add(line)
      line.position.y = 0.5
    },
    // 根据地理信息数据 进行 三维空间建模
    addBuilding (data, info, height = 1) {
      let config = {
        curveSegment: 1,
        depth: 0.05 * height,
        bevelEnabled: false,
        // bevelThickness: 1,
        // bevelSize: 1,
        // bevelOffset: 0,
        // bevelSegments: 1
      }
      let shape, geometry
      let holes = []
      for (let i = 0; i < data.length; i++) {
        // 每个建筑的 shape 的点数据
        let el = data[i]
        // 获得 shape
        // let shape = this.getShape(el)

        if (i === 0) {
          // 为0 就是建筑模型本体的
          shape = this.getShape(el, this.centerPosi)
        } else {
          // 剩下的，根据geojson数据的结构是模型的空洞
          holes.push(this.getShape(el, this.center))
        }
      }
      for (let i = 0; i < holes.length; i++) {
        shape.holes.push(holes[i])
      }
      // 获取geometry
      geometry = this.getGeometry(shape, config)
      geometry.name = info.name

      geometry.rotateX(Math.PI / 2)
      geometry.rotateZ(Math.PI)
      // buffer工具优化
      this.geometries.push(geometry)
      // 为了区分每一个建筑模型，需要借助 Box3Helper()
      let helper = this.getHelper(geometry)
      // helper有，就进入
      if (helper) {
        helper.name = info['name'] ? info['name'] : "Building"
        helper.info = info
        this.collider_building.push(helper)
      }

      // let mesh = new t.Mesh(geometry, buildMaterial)
      // this.scene.add(mesh)
    },
    getHelper (geometry) {
      // 先判断geometry 有没有boundingBox
      if (!geometry.boundingBox) geometry.computeBoundingBox()
      let box3 = geometry.boundingBox
      if (!isFinite(box3.max.x)) {
        return false
      }
      let helper = new t.Box3Helper(box3, 0xffff00)
      // 根据实际位置进行更新位置
      helper.updateMatrixWorld()
      return helper
    },
    // 获得 three 根据shape 拉伸的 geometry 数据
    getGeometry (shape, config) {
      let geo = new t.ExtrudeBufferGeometry(shape, config)
      // 加框，用户交互时候使用
      geo.computeBoundingBox()
      return geo
    },
    // 根据geojson 数据 制作shape
    getShape (points) {
      let shape = new t.Shape()
      for (let i = 0; i < points.length; i++) {
        let elp = points[i]
        elp = this.GPSRelativePosition(elp, this.center)
        if (i === 0) {
          shape.moveTo(elp[0], elp[1])
        } else {
          shape.lineTo(elp[0], elp[1])
        }
      }
      return shape
    },
    // 墨卡托投影 经纬度坐标 转换
    GPSRelativePosition (objPosi, centerPosi) {
      // 距离数据转换
      let dis = geolib.getDistance(objPosi, centerPosi)
      // 两个经纬度之间的角度
      let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi)
      // Calculate X by centerPosi.x + distance * cos(rad) x 和 y的三角形的两边长
      let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180))
      let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180))
      return [-x / 100, y / 100]
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.space {
  width: 100%;
  height: 100%;
}
</style>
