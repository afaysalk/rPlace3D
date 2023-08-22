# r/Place3D Three.js implementation

A project recreating the basic concept of [r/Place](https://www.reddit.com/r/place) using Three.js as a base


![a simple example](/example.png)


## What is r/Place?

Starting April 1st 2022, the social news website [Reddit](https://www.reddit.com) hosted [r/Place](https://www.reddit.com/r/place) - an event where users could place pixels on a shared canvas. Each user was only allowed to place one pixel every five minutes. Various communities organized efforts to create complex works of art. In total, the event lasted four days with over six million participants. Over 160 million pixels were placed on the canvas.

## What is This Project?

This project recreates the concept in a 3D plane. Users have a voxel grid where they can add or delete voxels , color them using a basic color wheel , and generally create whatever they want in the limits of said grid. Creations can also be exported to Blender in a GLB format, more info on this below.

Heavily inspired by voxel based games I used to play when I was younger, this repository strives to recreate some of that magic by letting you express yourself virtually, be it yourself or with your community.




## Prerequisites

- Python >=3.10 (tested on 3.10.2)
- Blender >=3.1 (tested on 3.1.2)


## Setup

1. Install [Python](https://www.python.org/) and [Blender](https://www.blender.org/download/) if you haven't already.
2. Clone this repository (or download it as a Zip file and extract).
   ![How to download the repository as a zip file](images/download-zip.jpg)


3. Open the repository in a terminal and open a new localhost HTTP server using :
   ```
   python3 -m http.server
   ```
   If that doesn't work, try it without the `3` after `python`:
   ```
   python -m http.server
   ```
   If it still doesn't work, then you probably didn't [add Python to your PATH](https://datatofish.com/add-python-to-windows-path/).



## Placing Voxels

You can simply start clicking on the grid to place a voxel. There are other tools to help you with your creations such as the Rectangle tool.

You can alos change material and color of the voxels with the color wheel.

## Exporting Models

If you wish to do so, you can export your model as a GLB file , compatible with Blender. It serves as a simplistic model builder, which could help with creating assets in a collaborative way.


## Other Fun Stuff

- [the r/Place Atlas (2022)](https://place-atlas.stefanocoding.me/): A searchable map of the r/Place canvas descriptions of all the different artworks.
- [PlaceViewer](https://github.com/GregBahm/PlaceViewer): r/Place in VR.
