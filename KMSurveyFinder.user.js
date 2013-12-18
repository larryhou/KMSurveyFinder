// ==UserScript==  
// @name         KM Survey Finder
// @version      1.0.0
// @author       larryhou@foxmail.com
// @namespace    https://github.com/larryhou
// @description  KM问卷调查搜索器
// @include      *://diaocha.oa.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// ==/UserScript== 

function install(callback)
{
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.textContent = "(" + callback.toString() + ")()";
	document.head.appendChild(script);
}

install(function()
{
	if (window.location.href.indexOf("http://diaocha.oa.com/SurveyList.aspx") != 0) return;
	if (parseInt(window.depth) > 0)return;
	
	var result = [];
	var provider = $("td").find("a[href^='javascript:__doPostBack']");
	
	var index = 0;
	var total = Math.min(prompt("输入搜索页面数量："), provider.length);
	
	function writeToWeb()
	{	
		var canvas = $("html");
		
		canvas.empty();
		canvas.css("font-familty", "Consolas");
		canvas.css("font-size", "14");
		canvas.css("margin-left", 20)
		
		var id = 0;
		result.forEach(function(item)
		{
			id++;
			$("<p>" + id + ". [" + item.date + "] <a href='" + item.url + "'>" + item.title + "</a></p>").appendTo(canvas);
		});
	}
	
	function search(list, flag)
	{
		list.each(function(index)
		{
			var date = $(this).parent().parent().find("span[id$='scription']").text();
			var expire = new Date(date);
			if (expire.getTime() > new Date().getTime())
			{
				result.push({
					url: "http://diaocha.oa.com/" + $(this).attr("href"),
					title: $(this).text(),
					t: expire.getTime(),
					exdate: expire.toLocaleString(),
					date: date
				});
			}
		});
		
		if (flag) return;

		++index;
		if (index >= total)
		{
			result.sort(function(a, b)
			{
				return a.t > b.t? 1 : -1;
			});
			
			console.log(result.length);
			console.log(JSON.stringify(result));
			writeToWeb();
		}
		else
		{
			request(index);
		}
	}
	
	function request(index)
	{
		var list = provider[index].href.match(/'([^']+)'/);
		if (!list || !list[1])
		{
			console.log("[ERROR]" + provider[index].href);
			return;
		}
		
		var target = list[1];
		console.log(target);
		$.ajax({
			type: "POST",
			url: "http://diaocha.oa.com/SurveyList.aspx?Type=1",
			data: {
				__EVENTTARGET: target,
				__EVENTARGUMENT: "",
				__VIEWSTATE: $("#aspnetForm input[id='__VIEWSTATE']").val()
			},
			beforeSend: function(xhr)
			{
				xhr.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
			},
			timeout:30000,
			success:function(msg)
			{				
				$("#ghost").remove();
				$("<iframe width='" + screen.width + "' height='400' id='ghost'/>").appendTo("body");
				var inner = window.frames["ghost"];
				inner.document.write(msg);
				inner.depth = 1;
				
				search($("td", inner.document).find("a[href^='ViewSurvey.aspx?SurveyID=']"));
			}
		});
	}
	
	search($("td", document).find("a[href^='ViewSurvey.aspx?SurveyID=']"), true);
	request(0);
});
