﻿/**
Провайдер AnyBalance (http://any-balance-providers.googlecode.com)
*/

var g_headers = {
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'Accept-Charset': 'windows-1251,utf-8;q=0.7,*;q=0.3',
	'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
	'Connection': 'keep-alive',
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36',
};

function main() {
	var prefs = AnyBalance.getPreferences();
	var baseurl = 'http://www.belssb.ru/';
	AnyBalance.setDefaultCharset('utf-8');
	
	checkEmpty(prefs.login, 'Введите логин!');
	checkEmpty(prefs.password, 'Введите пароль!');
	
	var html = AnyBalance.requestGet(baseurl + 'lk/?login=yes', g_headers);
	
	html = AnyBalance.requestPost(baseurl + 'lk/?login=yes', {
		'backurl':'/lk/',
		'AUTH_FORM':'Y',
		'TYPE':'AUTH',
		'USER_LOGIN':prefs.login,
		'USER_PASSWORD':prefs.password,
		'Login':'Войти'
	}, addHeaders({Referer: baseurl + 'lk/?login=yes'}));
	
	if (!/logout/i.test(html)) {
		var error = getParam(html, null, null, /<div[^>]+class="t-error"[^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i, replaceTagsAndSpaces, html_entity_decode);
		if (error)
			throw new AnyBalance.Error(error, null, /Неверный логин или пароль/i.test(error));
		
		AnyBalance.trace(html);
		throw new AnyBalance.Error('Не удалось зайти в личный кабинет. Сайт изменен?');
	}
	
	var result = {success: true};
	
	getParam(html, result, 'balance', />Адрес:(?:[^>]*>){5}([\s\S]*?<\/strong>)/i, [replaceTagsAndSpaces, /Долг\s*:?/i, '-'], parseBalance);
	getParam(html, result, 'acc_num', /Номер счета:([^>]*>){3}/i, replaceTagsAndSpaces, html_entity_decode);
	getParam(html, result, 'fio', /<th colspan="3">([^>]*>){1}/i, replaceTagsAndSpaces, html_entity_decode);
	
	html = AnyBalance.requestGet(baseurl + 'lk/billing/full.php', g_headers);
	
	getParam(html, result, 'prev', /<tr class="weight"(?:[^>]*>){2}\s*\d{1,2}.\d{1,2}.\d{2,4}(?:[^>]*>){2}(\d+)/i, replaceTagsAndSpaces, parseBalance);
	getParam(html, result, 'current', /<tr class="weight"(?:[^>]*>){2}\s*\d{1,2}.\d{1,2}.\d{2,4}(?:[^>]*>){4}(\d+)/i, replaceTagsAndSpaces, parseBalance);
	getParam(html, result, 'diff', /<tr class="weight"(?:[^>]*>){2}\s*\d{1,2}.\d{1,2}.\d{2,4}(?:[^>]*>){6}(\d+)/i, replaceTagsAndSpaces, parseBalance);
	
	AnyBalance.setResult(result);
}