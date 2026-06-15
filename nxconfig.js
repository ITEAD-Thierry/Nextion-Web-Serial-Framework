const myUI = {
	"baudSelector": document.getElementById("baudSelector"),
	"connectButton": document.getElementById("connectButton"),
	"reconnButton": document.getElementById("reconnButton"),
	"commandLine": document.getElementById("commandLine"),
	"sendButton": document.getElementById("sendButton"),
	"statusContainer": document.getElementById("statusContainer"),
	"logContainer": document.getElementById("logContainer")
};
const myPorts = [
	{ "usbProductId": 0xea60, "usbVendorId": 0x10c4 } // Nextion Foca Max Adapter
];