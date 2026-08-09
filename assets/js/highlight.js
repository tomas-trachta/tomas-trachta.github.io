(function () {
	var KEYWORDS = {
		csharp: ["abstract","as","async","await","base","bool","break","byte","case","catch","char",
			"checked","class","const","continue","decimal","default","delegate","do","double","else",
			"enum","event","explicit","extern","false","finally","fixed","float","for","foreach","get",
			"goto","if","implicit","in","init","int","interface","internal","is","lock","long",
			"namespace","new","null","object","operator","out","override","params","partial","private",
			"protected","public","readonly","record","ref","required","return","sbyte","sealed","set",
			"short","sizeof","stackalloc","static","string","struct","switch","this","throw","true",
			"try","typeof","uint","ulong","unchecked","unsafe","ushort","using","var","virtual","void",
			"volatile","when","where","while","yield"],
		cpp: ["alignas","alignof","and","asm","auto","bool","break","case","catch","char","char8_t",
			"char16_t","char32_t","class","concept","const","consteval","constexpr","constinit",
			"const_cast","continue","co_await","co_return","co_yield","decltype","default","delete",
			"do","double","dynamic_cast","else","enum","explicit","export","extern","false","final",
			"float","for","friend","goto","if","inline","int","long","mutable","namespace","new",
			"noexcept","nullptr","operator","override","private","protected","public","register",
			"reinterpret_cast","requires","return","short","signed","sizeof","static","static_assert",
			"static_cast","struct","switch","template","this","thread_local","throw","true","try",
			"typedef","typeid","typename","union","unsigned","using","virtual","void","volatile",
			"wchar_t","while"],
		bash: ["if","then","elif","else","fi","for","in","do","done","while","until","case","esac",
			"function","select","time","coproc","return","local","export","readonly","declare",
			"typeset","break","continue","exit"]
	};

	var TYPES = {
		csharp: ["Task","CancellationToken","CancellationTokenSource","IProgress","IReadOnlyList",
			"IEnumerable","List","Dictionary","HashSet","StringBuilder","Exception","TimeSpan","Guid",
			"DateTime","Stream","FileStream","FileSystemWatcher","ObservableCollection","Action","Func",
			"ParallelOptions","DirectoryInfo","FileInfo","Path","File","Directory","Convert","SHA256",
			"SemaphoreSlim","Rect","Point","Brush","Pen","SolidColorBrush","DrawingContext",
			"DrawingVisual","UIElement","DependencyProperty","Channel","UnboundedChannelOptions",
			"ProtectedData","DataProtectionScope","Process","ProcessStartInfo","IFileSystemProvider",
			"RemoteConnectionPool","EditOnServerWatcher","FileOperationQueue","SnapshotComponent",
			"ScanCore","CryptoComponent","QueueJobViewModel","FileOpsComponent","PersistenceMigrator",
			"DirOD","FileOD","TreeItemViewModel","TreeGraphControl","LocalFileSystemProvider",
			"FsEntry","OpResult","Lease","IdleEntry","Freezable"],
		cpp: ["HWND","HANDLE","HMONITOR","HTHUMBNAIL","HDWP","HRESULT","HDWP","DWORD","BOOL","UINT",
			"LONG","ULONGLONG","COLORREF","RECT","POINT","MONITORINFO","WCHAR","LPCWSTR","LPARAM",
			"WPARAM","size_t","uint64_t","int64_t","std","ComPtr","ID2D1Bitmap","ID2D1Factory1",
			"ID2D1Device","ID2D1DeviceContext","ID3D11Device","ID3D11DeviceContext","IDXGIDevice",
			"IDXGIFactory2","IDXGISwapChain1","IDCompositionDevice","IDCompositionTarget",
			"IDCompositionVisual","IDCompositionEffectGroup","IDCompositionAnimation","IDWriteFactory",
			"IWICImagingFactory","DWM_THUMBNAIL_PROPERTIES","HWINEVENTHOOK","PathConv","Executor",
			"FlowSignal","LoopFlowAction","Node","SimpleCommand","Arena","Renderer","Overlay",
			"WindowEntry","SitePool","Mount"]
	};

	function escapeHtml(s) {
		return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	function buildRegex(lang) {
		var parts = [];

		if (lang === "bash") {
			parts.push("(?<comment>#[^\\n]*)");
			parts.push("(?<string>\"(?:[^\"\\\\]|\\\\.)*\"|'[^']*')");
			parts.push("(?<variable>\\$\\{[^}]*\\}|\\$[A-Za-z_][A-Za-z0-9_]*|\\$[0-9]+|\\$[?$@#*])");
		} else {
			parts.push("(?<comment>\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)");
			if (lang === "cpp") {
				parts.push("(?<preproc>^[ \\t]*#[ \\t]*\\w[^\\n]*)");
			}
			parts.push("(?<string>@?\\$?\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*')");
		}

		parts.push("(?<number>\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?[uUlLfF]*\\b)");

		var kw = KEYWORDS[lang] || [];
		if (kw.length) parts.push("(?<keyword>\\b(?:" + kw.join("|") + ")\\b)");

		var ty = TYPES[lang] || [];
		if (ty.length) parts.push("(?<type>\\b(?:" + ty.join("|") + ")\\b)");

		if (lang !== "bash") {
			parts.push("(?<func>\\b[A-Za-z_]\\w*(?=\\())");
		}

		var flags = lang === "cpp" ? "gm" : "g";
		return new RegExp(parts.join("|"), flags);
	}

	function firstMatchedGroup(groups) {
		for (var key in groups) {
			if (groups[key] !== undefined) return key;
		}
		return null;
	}

	function highlightElement(codeEl, lang) {
		var raw = codeEl.textContent;
		var re = buildRegex(lang);
		var out = "";
		var lastIndex = 0;
		var match;

		while ((match = re.exec(raw)) !== null) {
			if (match.index > lastIndex) {
				out += escapeHtml(raw.slice(lastIndex, match.index));
			}

			var cls = firstMatchedGroup(match.groups || {});
			var text = match[0];

			out += cls
				? '<span class="tok-' + cls + '">' + escapeHtml(text) + "</span>"
				: escapeHtml(text);

			lastIndex = match.index + text.length;
			if (text.length === 0) re.lastIndex += 1;
		}

		out += escapeHtml(raw.slice(lastIndex));
		codeEl.innerHTML = out;
	}

	function init() {
		var blocks = document.querySelectorAll("pre code[class*='lang-']");
		for (var i = 0; i < blocks.length; i++) {
			var el = blocks[i];
			var m = el.className.match(/lang-(\w+)/);
			if (!m || !KEYWORDS[m[1]]) continue;
			highlightElement(el, m[1]);
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
