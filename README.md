# HumAngle VR Tour Editor Documentation
We’re building an open-source VR storytelling tool for media organisations. Naturally starting with 360 images, tours, and videos being made cross-platform across XR headsets, smartphones and computers. This will soon include 3D objects and animations in AR, audio and maybe even some voice AI integration (why not). Because of our limited resources and past experiences with services like this shutting down (Google Tour Creator) or going behind paywalls as SaaS products (Matterport) the architecture is designed to avoid making the existence of the tool expensive. Free open-sourced and focused on the logic generating WebXR pages/experiences. These generated web pages allow organisations like us to share immersive stories for XR without alienating people viewing from smartphones and computers.

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

## Contribute
[Donate](https://humanglemedia.com/donate/)
or send a pull request.