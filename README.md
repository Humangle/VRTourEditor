# HumAngle VR Tour Editor Documentation
HumAngle VR Tour Editor is a vanilla javascript based tour generation engine. This is used to display equirectangular images, videos and tours on web pages. These are also full webXR experiences on headsets and smartphones with ARCore or ARKit.
<iframe src="https://humangle.github.io/VRTourEditor/sample" style="width:500px; height:300px; border:none;" allowfullscreen> </iframe>

##	Getting Started
1. Go To [humangle.github.io/VRTourEditor](https://humangle.github.io/VRTourEditor) and select the "HumAngle Office Tour" Template. This is what [HumAngle VR Office Tour](https://humangle.github.io/VRTourEditor/sample) was created with.
2. Start an new project, make sure to insert your project name. Click on "+" to add the url links to your images. Your images can be hosted on github or any free platform that does not restrict access from another server (CORS policy). Tip: find the actual image location by right clicking and selecting "open image in new tab".
3. If your project has multiple images, you can create connections between them from each image. The VR Tour would begin from the first image uploaded or any index selected.
4. Export your project and host your generated web page online, you can embed it as shown in our [How to Embed](https://humangle.github.io/VRTourEditor/sample/how-to-embed) example.
```html
	<!--Replace "https://humangle.github.io/VRTourEditor/sample" with the link to where you have published your generated web page-->
	<iframe src="https://humangle.github.io/VRTourEditor/sample" style="width:500px; height:300px; border:none;" allowfullscreen> </iframe>
```
	
## 	Features

### 	Images and Videos

### 	Connections

### 	Audio

###		glTF Models

## 	HVRJ - HumAngle VR JSON Format
This is a JSON file saved with an extension .hvrj that allows you to keep and send a copy of your project to only be edited with the HumAngle VR Tour Editor. This allows you to easily update your projects/tours in future.