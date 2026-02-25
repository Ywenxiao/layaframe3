{
  "_$ver": 1,
  "_$id": "dnruc927",
  "_$runtime": "res://c9cb1ccd-f5ff-4749-9a9b-26438c64a2a0",
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
      "_$id": "xttlzwni",
      "_$type": "Area2D",
      "name": "Area2D",
      "x": 92,
      "y": 182,
      "width": 600,
      "height": 288,
      "_$child": [
        {
          "_$id": "jgis2772",
          "_$type": "Camera2D",
          "name": "Camera2D",
          "x": 332,
          "y": 307,
          "width": 0,
          "height": 0,
          "isMain": true,
          "limit_Left": -10000017,
          "positionSpeed": null
        },
        {
          "_$id": "pubhpbx6",
          "_$type": "GImage",
          "name": "img_1",
          "x": 35,
          "y": 38,
          "width": 512,
          "height": 313,
          "relations": [
            {
              "_$type": "Relation",
              "target": {
                "_$ref": "dnruc927"
              },
              "data": [
                1,
                0,
                6,
                1,
                13,
                1
              ]
            }
          ],
          "src": "res://c13c1b8e-c516-4a0f-98ad-e356f45f0365"
        },
        {
          "_$id": "15npfpiv",
          "_$var": true,
          "_$type": "GImage",
          "name": "img",
          "x": 151,
          "y": 436,
          "width": 256,
          "height": 152,
          "controllers": {
            "_$type": "Record",
            "c1": {
              "_$type": "Controller",
              "pages": [
                "",
                ""
              ]
            }
          },
          "gears": [
            {
              "_$type": "GearDisplay",
              "controller": {
                "_$ref": "15npfpiv",
                "_$ctrl": "c1"
              },
              "pages": [
                0
              ]
            }
          ],
          "src": "res://3225dc27-5bcb-446e-8b66-27df87624835",
          "_$comp": [
            {
              "_$type": "Animator2D",
              "controller": {
                "_$uuid": "2e280b3e-c774-401d-a35d-e2b5ab1677d3",
                "_$type": "AnimationController2D"
              }
            }
          ]
        },
        {
          "_$id": "whuqeccj",
          "_$prefab": "6a67834e-65b7-48a4-8d9e-7fa18f83833c",
          "_$var": true,
          "name": "btn_change",
          "active": true,
          "x": 269,
          "y": 375,
          "width": 128,
          "height": 47,
          "visible": true,
          "background": {
            "_$type": "DrawRectCmd",
            "fillColor": "#ffffff"
          },
          "controllers": {
            "_$type": "Record"
          },
          "title": "切换图片",
          "mode": 0,
          "selectedController": {
            "_$ref": "15npfpiv",
            "_$ctrl": "c1"
          },
          "selectedPage": 1
        }
      ]
    },
    {
      "_$id": "op6hzdtf",
      "_$type": "Area2D",
      "name": "Area2D_1",
      "x": -831,
      "y": 21,
      "width": 567,
      "height": 603,
      "_$child": [
        {
          "_$id": "1udsstw7",
          "_$type": "GImage",
          "name": "img",
          "x": -241,
          "y": 609,
          "width": 512,
          "height": 313,
          "src": "res://6c23c2cf-9faf-43bc-89cc-12cf97f2d2a9"
        },
        {
          "_$id": "4xdzs3bb",
          "_$type": "Camera2D",
          "name": "Camera2D",
          "width": 0,
          "height": 0,
          "isMain": true,
          "positionSpeed": null
        }
      ]
    }
  ]
}