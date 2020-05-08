const superagent = require('superagent')
const express = require('express')
const cheerio = require('cheerio')
const _ = require('underscore')
const async = require('async')
const url = require('url')
const fs = require('fs')
const app = express()
const userAgents = [
    'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.12) Gecko/20070731 Ubuntu/dapper-security Firefox/1.5.0.12',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Acoo Browser; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; .NET CLR 3.0.04506)',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.20 (KHTML, like Gecko) Chrome/19.0.1036.7 Safari/535.20',
    'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Fedora/1.9.0.8-1.fc10 Kazehakase/0.5.6',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.71 Safari/537.1 LBBROWSER',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 2.0.50727; Media Center PC 6.0) ,Lynx/2.8.5rel.1 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/1.2.9',
    'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; QQBrowser/7.0.3698.400)',
    'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; QQDownload 732; .NET4.0C; .NET4.0E)',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:2.0b13pre) Gecko/20110307 Firefox/4.0b13pre',
    'Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; fr) Presto/2.9.168 Version/11.52',
    'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.12) Gecko/20070731 Ubuntu/dapper-security Firefox/1.5.0.12',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; LBBROWSER)',
    'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Fedora/1.9.0.8-1.fc10 Kazehakase/0.5.6',
    'Mozilla/5.0 (X11; U; Linux; en-US) AppleWebKit/527+ (KHTML, like Gecko, Safari/419.3) Arora/0.6',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; QQBrowser/7.0.3698.400)',
    'Opera/9.25 (Windows NT 5.1; U; en), Lynx/2.8.5rel.1 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/1.2.9',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
]


// 搜索
// http://www.kuyunzyw.tv/index.php?m=vod-search&wd=
// 分类
// 1电影 2连续 3综艺 4动漫 5动作 6喜剧 7爱情 8科幻 9恐怖 10剧情 11战争 12国产 13香港 14台湾 15日本 16动画 17微电影 18纪录片 19韩国 20欧美 21海外 
// http://www.kuyunzyw.tv/?m=vod-type-id-1.html

// 首页
let indexUrl = 'http://www.kuyunzyw.tv';

//并发控制 10
let talk = 50;

// 设置动态请求头部 用户代理ip
let userAgent = userAgents[parseInt(Math.random() * userAgents.length)];
let userIp = _.random(1, 254) + "." + _.random(1, 254) + "." + _.random(1, 254) + "." + _.random(1, 254);

// 静态资源
app.use('/', express.static("./view"))

// 请求主页
app.get('/index', (req, res) => {
    let id = Number(req.query.id);
    let findUrl = finds(id);
    console.log(id, findUrl)
    start(findUrl, (data) => {
        res.json({
            msg: '获取数据成功',
            data
        })
    });
})

//搜索
app.get('/search', (req, res) => {
    let id = req.query.id;
    id = id.toString();
    let findUrl = finds(id);
    console.log(id, findUrl)
    start(findUrl, (data) => {
        res.json({
            msg: '搜索成功',
            data
        })
    });
})

//无此页面
app.use((req, res) => {
    res.status(404).send("没有这个页面！");
});

// 监听端口
app.listen(3000, () => {
    console.log('running in 3000')
})

// 筛选地址
function finds(id) {
    console.log(id, typeof (id))
    if (typeof (id) == "number") {
        if (id == 0) {
            return indexUrl + '/?m=vod-index-pg-1.html';
        } else if (id > 21) {
            return;
        } else {
            return indexUrl + "/?m=vod-type-id-" + id + ".html";
        }
    } else if (typeof (id) == "string") {
        return indexUrl + "/index.php?m=vod-search&wd=" + encodeURI(id);
    }
}

// 开始爬取
function start(surl, end) {
    // 开始伪装请求
    superagent.get(surl).set({
        "User-Agent": userAgent,
        "X-Forwarded-For": userIp
    }).timeout({
        response: 15000,
        deadline: 60000
    }).end(function (err, res) {

        // 错误返回
        if (err) {
            return console.error(err)
        }

        // 存放标题url的数组
        let topicUrls = [];
        let allUrls = [];
        let $ = cheerio.load(res.text);

        //获取首页所有的链接
        $('.row td a').each(function (i, el) {
            let href = url.resolve(indexUrl, $(el).attr('href'));
            allUrls.push(href);
        });

        // 排除多余地址
        for (i in allUrls) {
            if (allUrls[i].indexOf('detail') > 0) {
                topicUrls.push(allUrls[i])
            }
        }


        //获取每个链接的DOM结构，把当前链接的DOM结构callback出去
        let concurrencyCount = 0; //并发连接数的计数器
        let fetch = function (url, callback) {
            console.time('  耗时');
            concurrencyCount++;
            superagent.get(url).end(function (err, res) {
                console.log('并发数:', concurrencyCount--, 'fetch', url);
                if (res && res.text) {
                    callback(null, [url, res.text]);
                } else {
                    callback(url + "扒取不到[res.text]", null);
                }
            });
        }


        //此处的mapLimit函数里的callback对应fetch的参数形式
        async.mapLimit(topicUrls, talk, function (url, callback) {
            fetch(url, callback);
            console.timeEnd("  耗时");
        }, function (err, result) {
            if (err) {
                console.log(err)
            }
            //result有[url, res.text]
            result = result.map(function (pair) {
                // 处理结果
                if (pair[1] == null) {
                    console.log("结果没有[url, res.text]")
                    return;
                }
                let $ = cheerio.load(pair[1]);
                let hrefArr = [];
                let $href = $('table table').eq(1).find('input');
                $href.each(function (i, el) {
                    hrefArr.push($(el).val());
                });
                hrefArr.pop();
                hrefArr.pop();
                return ({
                    title: $('table td table font').eq(0) ? $('table td table font').eq(0).text() : null,
                    desc: $('table td table font').eq(10) ? $('table td table font').eq(10).text() : null,
                    img: $('.img img') ? $('.img img').attr('src') : null,
                    href: hrefArr,
                });
            });
            // console.log('final:\n', result);
            end(result);
        });
    });
}