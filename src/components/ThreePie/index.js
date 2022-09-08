import * as echarts from 'echarts'
import 'echarts-gl';
import utils from './utils';
console.log(utils,'llll')

// 初始化pie
export function initPie (that,refs) {
  //构建3d饼状图
  let myChart = echarts.init(refs);
  // 传入数据生成 option
  that.option = that.getPie3D(that.optionData, 0.8);
  myChart.setOption(that.option);
  //是否需要label指引线，如果要就添加一个透明的2d饼状图并调整角度使得labelLine和3d的饼状图对齐，并再次setOption
  that.option.series.push({
    name: 'pie2d',
    type: 'pie',
    labelLine: {
      length: 10,
      length2: 10
    },
    startAngle: -20, //起始角度，支持范围[0, 360]。
    clockwise: false,//饼图的扇区是否是顺时针排布。上述这两项配置主要是为了对齐3d的样式
    radius: ['20%', '50%'],
    center: ['50%', '50%'],
    data: that.optionData,
    itemStyle: {
      opacity: 0
    }
  });
  myChart.setOption(that.option);
  that.bindListen(myChart,that);
}