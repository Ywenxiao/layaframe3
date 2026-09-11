{
  "_$ver": 1,
  "_$id": "1gqx8zcc",
  "_$runtime": "res://7796b911-cff9-405e-a52d-090fb27a0b2d",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "Scene2D",
  "width": 750,
  "height": 1334,
  "bridge3D": {
    "_$type": "Bridge3DData",
    "scene3dSettings": {
      "ambientMode": null,
      "ambientIntensity": null,
      "shadowMapFrequency": null,
      "_reflectionsSource": null,
      "_reflectionsResolution": null,
      "_reflectionsIblSamples": null,
      "reflectionIntensity": null,
      "fogMode": null,
      "fogStart": null,
      "fogEnd": null,
      "fogDensity": null,
      "fogColor": null,
      "lightmaps": null
    }
  },
  "_$child": [
    {
      "_$id": "i8h5997d",
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
          "_$id": "z60zbc9n",
          "_$type": "Camera",
          "name": "Main Camera",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "y": 7600,
              "z": 500
            },
            "localRotation": {
              "_$type": "Quaternion",
              "x": -0.6835029051139487,
              "w": 0.7299477917637619
            }
          },
          "nearPlane": 10,
          "farPlane": 12000,
          "clearColor": {
            "_$type": "Color",
            "r": 0.39215686274509803,
            "g": 0.5843137254901961,
            "b": 0.9294117647058824
          }
        },
        {
          "_$id": "pfijjllt",
          "_$type": "Sprite3D",
          "name": "DirectionLight",
          "_$comp": [
            {
              "_$type": "DirectionLightCom"
            }
          ]
        },
        {
          "_$id": "nyf8xk6g",
          "_$var": true,
          "_$type": "Sprite3D",
          "name": "Ground"
        }
      ]
    }
  ]
}