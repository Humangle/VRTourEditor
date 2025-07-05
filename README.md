# HumAngle VR Tour Editor Documentation
This is an open-source VR storytelling tool for media organisations. This is used to display 360 images, tours, and videos across XR headsets, smartphones and computers. It allows you to design and generate XR experiences that can be embedded in web pages and launched to full VR for headsets and devices with ARCore/ARKit.

![HumAngle VR Office Tour](https://raw.githubusercontent.com/Humangle/VRTourEditor/refs/heads/main/assets/HumAngleVRTour.gif){ .image25percent }

##	Getting Started
1. Go To [humangle.github.io/VRTourEditor](https://humangle.github.io/VRTourEditor) and select the "HumAngle Office Tour" Template. This is what [HumAngle VR Office Tour](https://humangle.github.io/VRTourEditor/sample) was created with.
2. To start a new project, make sure to insert your project name. Click on "+" to add the url links to your images. Your images can be hosted on github or any free platform that does not restrict access from another server (CORS policy). Tip: find the actual image location by right clicking and selecting "open image in new tab".
3. If your project has multiple images, you can create connections between them from each image to form a Tour. The VR Tour would begin from the first image uploaded or any index selected.
4. Export your project and host your generated web page online, you can embed it as shown in our [How to Embed](https://humangle.github.io/VRTourEditor/sample/how-to-embed) example and other examples in our [360 Embed Library](https://humangle.github.io/360-embed-example).
```html
<!--Replace "https://humangle.github.io/VRTourEditor/sample" with the link to where you have published your generated web page-->
<iframe src="https://humangle.github.io/VRTourEditor/sample" style="width:500px; height:300px; border:none;" allowfullscreen> </iframe>
```
	
## 	Features

### 	Add 360 Images and Videos

### 	Create Connections

### 	Background Audio

###		Insert Models (glTF)

###		Animator

## 	HVRJ - HumAngle VR JSON Format
This is a JSON file saved with an extension .hvrj that allows you to externally store or share a copy of your project (only be edited with the HumAngle VR Tour Editor). This allows you to easily update your projects/tours in future.



### How to Contribute
Send a pull request or [Donate](https://humanglemedia.com/donate/).