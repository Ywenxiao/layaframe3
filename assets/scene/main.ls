{
  "_$ver": 1,
  "_$id": "uv71v8k4",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "Scene2D",
  "width": 750,
  "height": 1334,
  "_$child": [
    {
      "_$id": "ee4286xx",
      "_$type": "Scene3D",
      "name": "Scene3D",
      "skyRenderer": {
        "meshType": "dome"
      },
      "ambientColor": {
        "_$type": "Color",
        "r": 0.212,
        "g": 0.227,
        "b": 0.259
      },
      "_$child": [
        {
          "_$id": "dvvt0e8o",
          "_$type": "Camera",
          "name": "Camera",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": -0.8569722175348742,
              "y": -0.19282035734468606,
              "z": 5.000000000000863
            }
          },
          "fieldOfView": 29,
          "nearPlane": 0.3,
          "farPlane": 100,
          "clearColor": {
            "_$type": "Color",
            "r": 0.39215686274509803,
            "g": 0.5843137254901961,
            "b": 0.9294117647058824
          }
        },
        {
          "_$id": "jaytybfa",
          "_$type": "Sprite3D",
          "name": "Sprite3D",
          "_$comp": [
            {
              "_$type": "UI3D",
              "lightmapScaleOffset": {
                "_$type": "Vector4"
              },
              "prefab": {
                "_$uuid": "b0c7f4b6-9a33-4cd8-897e-4888efe760fe",
                "_$type": "Prefab"
              },
              "cameraSpace": true,
              "scale": {
                "_$type": "Vector2",
                "x": 1,
                "y": 0.3671875
              },
              "billboard": false
            }
          ]
        },
        {
          "_$id": "266e97qe",
          "_$type": "Sprite3D",
          "name": "Sprite3D_1",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "y": 0.4071913529131751
            }
          },
          "_$comp": [
            {
              "_$type": "UI3D",
              "lightmapScaleOffset": {
                "_$type": "Vector4"
              },
              "prefab": {
                "_$uuid": "b0c7f4b6-9a33-4cd8-897e-4888efe760fe",
                "_$type": "Prefab"
              },
              "scale": {
                "_$type": "Vector2",
                "x": 1,
                "y": 0.3671875
              }
            }
          ]
        }
      ]
    }
  ]
}