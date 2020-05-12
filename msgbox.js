/* #region css 样式 */
var msgboxCSS = document.createElement("style");
	msgboxCSS.innerHTML = `

	#messagebox {
		position: absolute;
		display: flex;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
	}
	.afterAnimation #messagebox {
		pointer-events: none;
	}
		.beforeAnimation #messagebox-background {
			background: rgba(255, 255, 255, 0);
		}
		#messagebox-background {
			position: absolute;
			width: 100%;
			height: 100%;
			background: rgba(255, 255, 255, 0.4);
			transition: background ease-out 0.4s;
			will-change: background;
		}
		.afterAnimation #messagebox-background {
			transition: background ease-out 0.2s;
			background: rgba(255, 255, 255, 0);
		}
		.beforeAnimation #messagebox-box {
			transform: scale(1.1);
			opacity: 0;
		}
		#messagebox-box {
			margin: auto;
			will-change: transform, opacity;
			transform: scale(1.0);
			opacity: 1;
			transition: transform cubic-bezier(0.33, 1, 1, 1) 0.3s, opacity linear 0.2s;
			width: 400px;
			height: 200px;
			background: #EEE;
			border-radius: 16px;
			overflow: hidden;
			box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.15);
		}
		.afterAnimation #messagebox-box {
			transition: all linear 0.2s;
			transform: scale(1.1);
			opacity: 0;
		}
			#messagebox-titlebar {
				height: 28px;
				z-index: 1;
				background: linear-gradient(180deg, white, #EEE);
				box-shadow: 0px 10px 20px -5px rgba(0, 0, 0, 0.15),
							0px  4px  8px -3px rgba(0, 0, 0, 0.1);
			}
			#messagebox-titletext {
				position: absolute;
				display: inline-block;
				top: 3px;
				width: 100%;
				font-size: 16px;
				text-align: center;			
			}
			#messagebox-contenttext {
				position: relative;
				display: block;
				top: 48px;
				left: 50%;
				transform: translateX(-50%);
				width: 85%;
				text-align: center;
			}
			.msgbutton {
				width: 100px;
				height: 32px;
				line-height: 32px;
				border-radius: 32px;
				text-align: center;
				-webkit-user-select: none;
			}
			.msgbutton:hover:before {
				position: absolute;
				display: inline-block;
				left: 0;
				content: "";
				width: 100px;
				height: 32px;
				border-radius: 32px;
				background: -webkit-linear-gradient(-90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
			}
			.msgbutton-skyblue {
				background: linear-gradient(180deg, #7BF, #5AE);
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 16px -4px #7BF;
			}
			.msgbutton-skyblue:hover {
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 24px 0px #7BF;				
			}
			.msgbutton-skyblue:active {
				background: linear-gradient(180deg, #48C, #5AE);
			}
			.msgbutton-white {
				background: linear-gradient(180deg, #FFF, #DDD);
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 16px -4px #FFF;
			}
			.msgbutton-white:hover {
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 24px 0px #FFF;				
			}
			.msgbutton-white:active {
				background: linear-gradient(180deg, #BBB, #DDD);
			}
			#messageconfirm {
				position: absolute;
				top: 130px;
				left: calc(50% - 120px - 20px);
			}
			#messagecancel {
				position: absolute;
				top: 130px;
				left: calc(50% + 20px);
			}

	.popup {
		position: absolute;
		bottom: 10%;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
	}
		.beforeAnimation .popup-box {
			opacity: 0;
			transform: scale(0.5);
		}
		.popup-box {
			padding: 12px;
			background: #FBFBFB;
			will-change: transform, opacity;
			opacity: 1;
			transform: scale(1);
			transition: transform 0.5s cubic-bezier(0.4, 1.3, 0.4, 1), opacity 0.2s linear;
			border: #AAA 1px solid;
			border-radius: 12px;
			box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
			z-index: 5;
		}
		.afterAnimation .popup-box {
			transition: opacity 0.7s ease-out;
			opacity: 0;
		}
		.popup-ok {
			background: linear-gradient(180deg, #5e5, #3c3);
			border-color: #27a727;
			box-shadow: 0px 4px 8px rgba(85, 238, 85, 0.3);
			color: white;
		}
		.popup-warning {
			background: linear-gradient(180deg,#ffd966,#ffcc33);				
			border-color: #ddbb44;
			box-shadow: 0px 4px 8px rgba(160, 127, 0, 0.3);
			color: #665214;
		}
		.popup-error {
			background: #F76767;
			border-color: #B33;
			box-shadow: 0px 4px 8px rgba(127, 0, 0, 0.3);
			color: white;
		}
			.popup-message {
				font-size: 16px;
				line-height: 1.3em;
				text-align: center;
			}

`
	document.body.appendChild(msgboxCSS);

/* #endregion */


/* #region 通用函数 */

	var centerview = document.getElementById("centerview");

	function randomString (length, chars) {
		var result = '';
		for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
		return result;
	}

/* #endregion */


/* #region 消息弹窗 */
	
	var onBtnOKCallBack;
	var onBtnCancelCallBack;

	function Messagebox(title, content, btnOK, btnCancel, onBtnOK, onBtnCancel) {
		var innerHTML = ``;
		innerHTML += `<div id="messagebox-background"></div>`;
		innerHTML += `<div id="messagebox-box">`;
			innerHTML += `<div id="messagebox-titlebar">`;
				innerHTML += `<span id="messagebox-titletext">${title}</span>`
			innerHTML += `</div>`;
			innerHTML += `<div id="messagebox-content">`;
				innerHTML += `<span id="messagebox-contenttext">${content}</span>`;
				innerHTML += `<div id="messageconfirm" class="msgbutton msgbutton-skyblue" onclick="onBtnOKPressed()">${btnOK}</div>`;
				innerHTML += `<div id="messagecancel" class="msgbutton msgbutton-white" onclick="onBtnCancelPressed()">${btnCancel}</div>`
			innerHTML += `</div>`;
		innerHTML += `</div>`;
		
		var messagebox = document.createElement("div");
		messagebox.innerHTML = innerHTML;
		messagebox.className = "beforeAnimation";
		messagebox.id = "messagebox";
		onBtnOKCallBack = onBtnOK;
		onBtnCancelCallBack = onBtnCancel;
		document.getElementById("centerview").appendChild(messagebox);
		setTimeout(() => {
			messagebox.className = "";
		}, 1);
	}
	function onBtnOKPressed() {
		if (onBtnOKCallBack) {
			onBtnOKCallBack();
		}
		var messagebox = document.getElementById("messagebox");
		messagebox.className = "afterAnimation";
		setTimeout(() => {
			messagebox.remove();
		}, 500);
	}
	function onBtnCancelPressed() {
		if (onBtnCancelCallBack) {
			onBtnCancelCallBack();
		}
		var messagebox = document.getElementById("messagebox");
		messagebox.className = "afterAnimation";
		setTimeout(() => {
			messagebox.remove();
		}, 500);
	}	

/* #endregion */


/* #region 气泡弹窗 */

	function popup(text, level = 0) {
		var contentWrapper = document.getElementById("content-wrapper");
		var popup = document.createElement("div");
		popup.className = "popup beforeAnimation"
		var backgroundClass = "";
		switch (level) {
			case 1:
				backgroundClass = "popup-ok"; break;
			case 2:
				backgroundClass = "popup-warning"; break;
			case 3:
				backgroundClass = "popup-error"; break;
		}
		// popup.id = "popup-box-" + ("0000" + infoID_count).slice(-5);
		innerHTML = ``;
		innerHTML += `<div class="popup-box ${backgroundClass}">`;
			innerHTML += `<div class="popup-message">`;
				innerHTML += text;
			innerHTML += `</div>`;
		innerHTML += `</div>`;
		popup.innerHTML = innerHTML;
		contentWrapper.appendChild(popup);
		setTimeout(() => {
			popup.classList.remove("beforeAnimation");
		}, 1);

		setTimeout(() => {
			popup.classList.add("afterAnimation");
		}, 2500 + text.length * 100);
		setTimeout(() => {
			popup.remove();
		}, 3200 + text.length * 100);
	}

/* #endregion */