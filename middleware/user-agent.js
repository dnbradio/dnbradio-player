export default function (context) {
    context.userAgent = process.server ? context.req.headers['user-agent'] : navigator.userAgent
    console.log(context.userAgent);
    if (/iphone_os_4|iphone_os_5|iphone_os_6|iphone_os_7|iphone_os_8|iphone_os_9|safari\/525|safari\/533|safari\/534|safari\/601|safari\/600/i.test(context.userAgent)) {
      console.log('redirecting...');
      context.redirect('https://dnbradio.com/mobile');
    }
}

