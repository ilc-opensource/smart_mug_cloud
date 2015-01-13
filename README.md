# Cloude service for smart mug
![cloud_for_smart_mug](https://cloud.githubusercontent.com/assets/7992647/5716712/affdb57e-9b2e-11e4-8b66-c895d03ff5a5.png)

- weChat, weiBo, twitter, and freeDraw;
- convert English and Chinese character to image;
- multi-media file convertor

## Files
- key2doll.json: define menu for weChat, and handle menu event
- createMenu.js: create menu for weChat
- ccount.json: map of account info of each app and smart mug ID
- enCharacter.json: Used in converting English character to image
- image_creator: client of image creator

## weChat
1. Registration, send the smart mug ID to cloud throught weChat client, cloud service will link the user's weChat account and smart mug automatically.
2. User can send any English and Chinese character and punctuations.
3. Predefine icons
4. Send and receive multi-media between weChat client and smart mug. 

## WeiBO authorization
1. Visit http://www.pia-edison.com/weibo_smart_mug to authorize;
2. Redirect uri of the WeiBo App must be set as http://www.pia-edison.com/weibo

## Directory
- media:
	- predefine: // Some predefined icons
		- Dolls, weather, email
	- Chinese: // Images of Chinese characters, they are created at runtime
		- *.jpg
	- weChatAudio: // audio file download from weChat server or upload from smart mug
		- *.amr, *.mp3
	- smart_mug accounts: // It is created when one smart mug visits cloud first time
		- weChat:
		- weiBo:

## Smart mug query
Client Query Parameters: mugID, app, appParameter

## Contact
- Chao Zhang (chao.a.zhang@intel.com)

## Copyright and license

[The Apache 2.0 license](LICENSE).
