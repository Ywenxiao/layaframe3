{
  "_$ver": 1,
  "_$id": "e2dvtn9c",
  "_$runtime": "res://e660923a-8485-43d4-9707-c5050731d51b",
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
      "_$id": "usysb6e6",
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
          "_$id": "j53tnesb",
          "_$type": "Camera",
          "name": "Camera",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": 0.019588230161149633,
              "y": -1.214470366559278
            }
          },
          "fieldOfView": 68,
          "nearPlane": 0.3,
          "farPlane": 1000,
          "clearColor": {
            "_$type": "Color",
            "r": 0.39215686274509803,
            "g": 0.5843137254901961,
            "b": 0.9294117647058824
          }
        },
        {
          "_$id": "sgaizfta",
          "_$type": "Sprite3D",
          "name": "Sprite3D",
          "active": false,
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
          "_$id": "us57tn37",
          "_$type": "Sprite3D",
          "name": "Sprite3D_1",
          "_$comp": [
            {
              "_$type": "MeshFilter",
              "sharedMesh": {
                "_$uuid": "7e9b0d09-b83c-425d-adf1-3d319f026e38",
                "_$type": "Mesh"
              }
            },
            {
              "_$type": "MeshRenderer",
              "lightmapScaleOffset": {
                "_$type": "Vector4"
              },
              "sharedMaterials": [
                null
              ]
            }
          ]
        }
      ]
    }
  ]
}