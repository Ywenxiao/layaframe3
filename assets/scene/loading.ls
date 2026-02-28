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
      "_$id": "pubhpbx6",
      "_$type": "GImage",
      "name": "img_1",
      "x": 127,
      "y": 220,
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
      "x": 247,
      "y": 618,
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
          },
          "controllerLayers": [
            {
              "_$type": "AnimatorControllerLayer2D",
              "name": "Base Layer",
              "states": [
                {
                  "_$type": "AnimatorState2D",
                  "name": "login_start",
                  "clipStart": 0,
                  "clip": {
                    "_$uuid": "4c5b10d1-9c32-4d0f-8676-1d7370b7958e",
                    "_$type": "AnimationClip2D"
                  },
                  "soloTransitions": []
                }
              ],
              "defaultStateName": "login_start"
            }
          ]
        }
      ]
    },
    {
      "_$id": "whuqeccj",
      "_$prefab": "6a67834e-65b7-48a4-8d9e-7fa18f83833c",
      "_$var": true,
      "name": "btn_change",
      "active": true,
      "x": 375,
      "y": 557,
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
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "15npfpiv"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
      "title": "切换图片",
      "mode": 0,
      "selectedController": {
        "_$ref": "15npfpiv",
        "_$ctrl": "c1"
      },
      "selectedPage": 1
    },
    {
      "_$id": "ffmja8xh",
      "_$type": "GPanel",
      "name": "panel",
      "x": 98,
      "y": 131,
      "width": 400,
      "height": 400,
      "layout": {
        "type": 1
      },
      "_$child": [
        {
          "_$id": "tavoi794",
          "_$prefab": "db0cc9bc-5707-40c9-b675-51ed77076eb5",
          "name": "Radio",
          "active": true,
          "x": 0,
          "y": 0,
          "visible": true,
          "mode": 1
        }
      ]
    }
  ]
}