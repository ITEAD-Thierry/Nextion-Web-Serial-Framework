# Nextion Web Serial Framework

## Introduction
[**NEXTION HMI by ITEAD**](https://itead.cc/nextion-display/ref/35/) are LCD screens in various sizes and formats with an integrated MCU. An proprietary firmware kernel allows them to communicate with external devices via a standardized ASCII based serial protocol which opens an extremely wide field of applications for commercial, industrial, and hobby solutions. The free [**Nextion Editor**](https://nextion.tech/nextion-editor/#_section1) for Windows allows everybody to easily develop HMI applications by designing screens in WYSIWYG manner, adding pre-configured components and event code, and creating and adding resources like pictures, fonts, audio and video files. An integrated simulator/debugger allows to fully test such an application interactively on the PC before compiling and uploading it to the HMI device.

Why then this project? As the author of the [**Nextion Sunday Blog**](https://nextion.tech/category/background-information/), I'm getting much feedback from my readers. And so I learned that if you have a (more or less) commercial Nextion HMI based project and customers around the world, the deployment of software updates may become complicated. Either you implement the Nextion upload protocol yourself in a proprietary solution, or you require your customers to do a full install of the Nextion Editor and its dependencies (.NET framework 3.5 and MSVC runtime 2015) which may not always be possible.

## Solution & Deployment
While the Web Serial Api was for a long time on beta level and not widely supported, it's today available in most browsers like Firefox, Chrome, Edge, and Opera for all common platforms (Windows, MacOS, Linux). Thus, I decided to give it a try and started experimenting with it. Now, the plan is to have an easy to deploy tool available online, either using my [**Reference installation**](https://nextionweb.dvox-instruments.tf), or cloning and modifying it before you host your customized version for yourself and your customers. The frontend is in very simple html/css with a flex layout. All active code is in "pure" javascript without the need for third party libraries or jQuery. A configuration file at root level allows to make the link between the html interface and the nxUI object, so that you are free to re-arrange the interface with different element IDs. The nxUI object (in /assets/nxclasses.js) has static lists which can easily be modified to change the interface language.

This framework is intended to go beyond a simple "uploader" for software and firmware updates. It will over time get at least the full functionality of the Nextion simulator and debugger, too, so that the following actions will be possible:
1. Select and connect to a USB-to-TTL serial adapter with attached Nextion HMI
2. Retrieve and display system information about the attached Nextion HMI
3. Initialize and set the internal RTC (Enhanced, Intelligent, and Edge series)
4. Initialize, write to, read from, or erase the internal EEPROM
5. Debugging: Send commands to the Nextion HMI, receive, decode, and display the answer.
6. Upload compiled .tft files to the Nextion's flash memory.
7. Allow file transfer from and to the Nextion's SD card or memory
8. "Trap" and filter the Nextion's data returns and allow additial javascript actions through callback functions, similar to the famous listener list in the Nextion Arduino library.

## A word about connectivity
By default, the web browser's dialog for selecting and opening a Com port lists many virtual and bluetooth ports, especially in Linux and macOS. To prevent confusion at the end user's side, I added a filter list to nxconfig.js to limit the choice to known working USB to TTL serial adapters. Actually, the only "allowed" item in this list is the CP2102 chip based [Nextion Foca Max Adapter](https://itead.cc/product/nextion-foca-max-5v2a-output-usb-to-ttl-serial-converter-board/ref/35/) which cares in addition also about the Nextion HMI's power supply. If you know about other known working (with Nextion) USB to TTL serial adapters, don't hesitate to use the "issues" tab here on GitHub and to communicate me the corresponding VID/PID pair, so that I can add it to the list!

## Work in progress...
The current version 0.2 manages already the steps 1 and 5 of the above list fully, and 2, 3 and 8 partially. As soon as I'll have added everything for the Nextion's extended address mode, 2, 3 and 8 will be completed and v.0.3 will be published. Afterwards I'll care about the remaining tasks. 

## Documentation
For documentation, explanations, use cases, and examples, please read my corresponding Nextion Sunday Blog posts:
+ [Control your Nextion HMI from (almost) any web browser](https://bit.ly/nexblog260607) from June 07, 2026
+ *(more to come very soon...)*

## Last but not least
You have any questions, comments, critics, or suggestions? Just send me an email to thierry (at) itead (dot) cc! 🙂

And, by the way, if you like and you find useful what I write, and you are about to order Nextion stuff with Itead, please do so by clicking [**THIS REFERRAL LINK!**](https://itead.cc/nextion-display/ref/35/) To you, it won’t forcibly make a change for your order but on some products, you may even get a 10% discount using the coupon code **THIERRYFRSONOFF**. In ever case, it will pay me perhaps the one or the other beer or coffee. And that will motivate me to continue my work on this project 😉

Thank you for reading and happy Nextioning!
