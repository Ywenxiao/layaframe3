{
  "_$ver": 1,
  "_$id": "zidzqoav",
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
      "_$id": "n9gjxcltvl",
      "_$type": "Scene3D",
      "name": "Scene3D",
      "skyRenderer": {
        "meshType": "dome",
        "material": {
          "_$uuid": "793cffc6-730a-4756-a658-efe98c230292",
          "_$type": "Material"
        }
      },
      "ambientColor": {
        "_$type": "Color",
        "r": 0.424308,
        "g": 0.4578516,
        "b": 0.5294118
      },
      "fogStart": 0,
      "fogEnd": 300,
      "fogColor": {
        "_$type": "Color",
        "r": 0.5,
        "g": 0.5,
        "b": 0.5
      },
      "_$child": [
        {
          "_$id": "6jx8h8bvc6",
          "_$type": "Camera",
          "name": "Main Camera",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "z": 10
            }
          },
          "fieldOfView": 29,
          "nearPlane": 0.3,
          "farPlane": 1000,
          "clearColor": {
            "_$type": "Color",
            "r": 0.018591999999999942,
            "g": 0.2494637989949749,
            "b": 0.6639999999999999
          }
        },
        {
          "_$id": "6ni3p096l5",
          "_$type": "Sprite3D",
          "name": "Direction Light",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": 5,
              "y": 5,
              "z": 5
            },
            "localRotation": {
              "_$type": "Quaternion",
              "x": -0.40821789367673483,
              "y": 0.23456971600980447,
              "z": 0.109381654946615,
              "w": 0.875426098065593
            }
          },
          "_$comp": [
            {
              "_$type": "DirectionLightCom",
              "color": {
                "_$type": "Color",
                "r": 0.6,
                "g": 0.6,
                "b": 0.6
              }
            }
          ]
        },
        {
          "_$id": "pptrkpd5",
          "_$prefab": "fa978fdd-6da7-428d-9917-98519471515c",
          "name": "Sprite3D",
          "active": true,
          "layer": 0,
          "transform": {
            "localPosition": {
              "_$type": "Vector3"
            },
            "localRotation": {
              "_$type": "Quaternion"
            }
          }
        },
        {
          "_$id": "sbyb3lsn",
          "_$prefab": "fa978fdd-6da7-428d-9917-98519471515c",
          "name": "Sprite3D_1",
          "active": true,
          "layer": 0,
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": 1
            },
            "localRotation": {
              "_$type": "Quaternion"
            }
          }
        },
        {
          "_$id": "uju3cw30",
          "_$prefab": "fa978fdd-6da7-428d-9917-98519471515c",
          "name": "Sprite3D_2",
          "active": true,
          "layer": 0,
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": 2
            },
            "localRotation": {
              "_$type": "Quaternion"
            }
          }
        },
        {
          "_$id": "3c10249k",
          "_$prefab": "fa978fdd-6da7-428d-9917-98519471515c",
          "name": "Sprite3D_3",
          "active": true,
          "layer": 0,
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "y": 1
            },
            "localRotation": {
              "_$type": "Quaternion"
            }
          }
        },
        {
          "_$id": "ij0q02ds",
          "_$prefab": "fa978fdd-6da7-428d-9917-98519471515c",
          "name": "Sprite3D_4",
          "active": true,
          "layer": 0,
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": 1.0789853816798958
            },
            "localRotation": {
              "_$type": "Quaternion"
            }
          }
        }
      ]
    }
  ]
}