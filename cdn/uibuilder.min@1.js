!function(v){var d=/CLASS/g;function p(e){var t=this;t.id=e.id,t.query=e.query,t.app=e,t.cache=e.cache,t.class=e.class,t.components=e.components,t.instances=[],t.events={}}function l(e){var t,n={},i={},o=!1;e.$rebindtimeout=null;for(r of e.instances)!r.config.path||'@'!==r.config.path.charAt(0)||(t=r.config.path.substring(1))!=r.id&&(n[t]?n[t].push(r):n[t]=[r],i[r.id]=t,o=!0);if(o)for(var r of e.instances)r.binded=n[r.id]||null,r.binder=i[r.id]?e.instances.findItem('id',i[r.id]):null}function f(){}function m(){var e=this;e.state={init:0,value:null,disabled:!1,modified:!1,readonly:!1,touched:!1,invalid:!1,delay:10,notify:!1,bind:!1,validate:!0},e.cache={},e.events={},e.$inputs={},e.$outputs={}}p.prototype.urlify=function(){return this.app.urlify.apply(this.app,arguments),this},p.prototype.clfind=function(){return this.app.clfind.apply(this.app,arguments),this},p.prototype.clread=function(){return this.app.clread.apply(this.app,arguments),this},p.prototype.view=function(){return this.app.view.apply(this.app,arguments),this},p.prototype.clean=function(){return this},p.prototype.on=function(e,t){var n=this;n.events[e]?n.events[e].push(t):n.events[e]=[t]},p.prototype.rebind=function(){var e=this;e.$rebindtimeout&&clearTimeout(e.$rebindtimeout),e.$rebindtimeout=setTimeout(l,50,e)},p.prototype.emit=function(e,t,n,i,o,r){e=this.events[e];if(e)for(var s of e)s.call(this,t,n,i,o,r)},p.prototype.emitstate=function(e){var t,n={},i='state',o=e.instance,r=(e.instance.cache.e=null,o.parent);for(e.level=0;r&&(e.level++,n[r.id]=!0,!r.fork)&&(r.events[i]&&r.emit(i,e),!e.$propagation);)r=r.parent;e.level=null,i='@state';for(t of this.instances)n[o.id]||t===e.instance||t.events[i]&&t.emit(i,e)},customElements.define('uibuilder-component',class extends HTMLElement{constructor(){super(),setTimeout(()=>this.compile(),1)}compile(){var e,t=this,n=t.parentNode,f=v.selectors.component.substring(1);for(t.classList.add('block');n;){if('BODY'===n.tagName)return;if(n.classList.contains(f)){e=n.uibuilder;break}n=n.parentNode}var i,o=!0,r=(e.fork||(o=!1,e.fork=new p(e.app),e.fork.element=e.element,e.fork.compile=y,e.root=e),(t.getAttribute('config')||'').parseConfig()),s={},a=(s.id=t.getAttribute('uid')||'ui'+GUID(10),s.config=r||{},s.component=t.getAttribute('name'),!1);for(i in r)if('#'===r[i]){var c=t.children[0];if(c&&'SCRIPT'===c.tagName)switch(c.getAttribute('type')){case'application/json':case'text/json':r[i]=PARSE(c.innerHTML.trim());break;case'text/html':case'text/plain':r[i]=c.innerHTML.trim()}else r[i]=t.innerHTML;a=!0}a&&(t.innerHTML='');var l=t.getAttribute('path'),l=(l&&(r.path=l),e.fork.components[s.component]);if(!l)return console.error('UI Builder: The component not found: '+s.component),void t.parentNode.removeChild(t);t.innerHTML&&(r.name=t.innerHTML.trim(),t.innerHTML=''),r.name||(r.name=l.name),(r.$bind||t.getAttribute('bind'))&&(instance.state.bind=!0),(r.$notify||t.getAttribute('notify'))&&(instance.state.notify=!0),s.readonly=!0,e.fork.compile(t,s,null,null,t),t.uibuilder&&(t.uibuilder.parent=e),e.fork.rebind();l=t.classList;l.remove('invisible'),l.remove('hidden'),o||setTimeout(e=>e.emit('fork',e.fork),1,e)}}),f.prototype.stopPropagation=function(){this.$propagation=!0};function i(){return''}var e=m.prototype;e.$forcecheck=function(e){e.$checktimeout=null,e.set('invalid',!e.state.disabled&&!e.state.readonly&&(!!e.validate&&!e.validate()))},e.$forcechange=function(e){e.$changetimeout=null,e.app.emit('change',e)},e.change=function(){var e=this;e.app.events.change&&(e.$changetimeout&&clearTimeout(e.$changetimeout),e.$changetimeout=setTimeout(e.$forcechange,333,e))},e.check=function(e){var t=this;if(!1!==t.state.validate)return t.$checktimeout&&clearTimeout(t.$checktimeout),e?t.$forcecheck(t):t.$checktimeout=setTimeout(t.$forcecheck,150,t),t};function o(e,t,n,i){var o={};o.id=e.id+'_'+t.id,o.instanceid=e.id,o.componentid=e.component.id,o.ref=t.id,o.icon=t.icon,o.color=t.color,o.note=t.note,o.name=t.name,o.component=e.component,o.app=e.app,o.instance=e,o.err=n,o.data=i,e.app.emit('output',o),v.emit('output',o)}function y(l,e,u,t,n,i){var o=this,r=o.components[e.component];if(r){var s=n||document.createElement('DIV'),f=new m;if(s.classList.add('ui_'+r.id),e.gap&&s.classList.add('UI_gap'),r.floating&&(s.classList.add('UI_floating'),s.style='left:{0}px;top:{1}px;z-index:{2};position:absolute'.format(e.x||0,e.y||0,e.zindex||1)),e.bind&&(f.state.bind=!0),e.notify&&(f.state.notify=!0),r.config||(r.config={}),f.id=e.id,f.args=o.args,f.newbie=i||e.newbie,f.element=$(s),f.element.aclass(v.selectors.component.substring(1)+' '+r.cls).attrd('id',e.id),f.dom=s,f.events={},f.config=CLONE(r.config),f.app=o,f.component=r,f.protected=e.protected,f.meta=e,f.edit=k,e.newbie&&delete e.newbie,n&&(f.forked=!0),e.config)for(var a in e.config)f.config[a]=e.config[a];if(f.config.name||(f.config.name=r.name),o.instances.push(f),s.uibuilder=f,!n){var c=l.closest(v.selectors.component);if(c&&c.length&&(f.parent=c[0].uibuilder,f.parent&&((i=f.parent).children||(i.children=[]),i.containers||(i.containers={}),a='container'+u,i.children.push(f),i.containers[a]?null==t?i.containers[a].push(f):i.containers[a].splice(t,0,f):i.containers[a]=[f])),c=$(l),null==t)c.append(s);else{for(var p=!1,d=0;d<c[0].children.length;d++)if(d===t){c[0].insertBefore(s,c[0].children[d]),p=!0;break}p||c.append(s)}}r.make&&r.make(f,f.config,f.element,f.component.cls),v.events.make&&v.emit('make',f),n||(e.children instanceof Array?setTimeout(function(e,t){for(var n=g(e,t.id),i=0;i<t.children.length;i++){var o=n.findItem('index',i);if(o)for(l of t.children[i])e.compile(o.element,l,i)}var r=e.components[t.component];if(r.children)for(var s={},a=CLONE(r.children),c=function(e){for(var t of e)for(var n of t)s[n.id]=f.id+'X'+HASH(n.id).toString(36),n.children&&n.children.length&&c(n.children)},r=(c(a),Object.keys(s)),r=new RegExp(r.join('|'),'g'),a=PARSE(JSON.stringify(a).replace(r,e=>s[e])),i=0;i<a.length;i++){var l,o=n.findItem('index',i);if(o)for(l of a[i])e.compile(o.element,l,i)}e.refreshio()},1,o,e):o.refreshio())}else console.error('UI Builder: The component "{0}" not found'.format(e.component))}function r(){for(var e=0,t=0,n=[];;){var i=this.instances[e];if(!i)break;if(function(e){if(e){if('BODY'===e.tagName)return 1;for(var t=e.parentNode;t;){if('BODY'===t.tagName)return 1;t=t.parentNode}}}(i.dom))e++;else{if(t++,i.removecss)for(var o of i.removecss)CSS('',o);i.events.destroy&&i.emit('destroy'),this.instances.splice(e,1),n.push(i)}}if(this.refreshio(),t)for(var r of this.instances)r.events.refresh&&r.emit('refresh',{type:'remove',items:n})}e.maketemplate=function(e){var t=this;if(!(e=e||t.component.html))return i;var n=HASH(e).toString(36);return t.app.cache[n]||(t.app.cache[n]=-1===e.indexOf('{{')?()=>e:Tangular.compile(e),t.app.cache[n])},e.error=function(e){var t=this.config;console.error('UIBuilder:',this.component.name+' - '+t.name+(t.path?' ({0})'.format(t.path):''),e)},e.clone=function(e){var t=e;return'object'==typeof e&&(!e||e instanceof Date||(t=CLONE(e))),t},e.set=function(e,t,n,i){var o,r,s=this,a=!1;switch(e){case'disabled':case'modified':case'readonly':case'touched':case'invalid':a=!0,t=!!t}if('touched'===e&&s.check(),s.state[e]===t)return!1;if(s.state[e]=t,s.events.set&&s.emit('set',e,t,n),s.change(),'value'===e){if(s.events.value&&s.emit('value',t,n),s.binded)for(var c of s.binded)c!==i&&(o=s.clone(t),c.state.notify?c.emit('notify',o,s):c.set('value',o,i?'noemitstate':'',s));s.binder&&!s.state.notify&&s.binder!==i&&s.binder.set('value',s.clone(t),i?'noemitstate':'',s),s.check()}if('noemitstate'!==n)return r=s.cache.e,a&&s.element.tclass('UI_'+e,t),r?s.cache.e.changes[e]=1:((r=s.cache.e=new f).id=s.id,r.instance=s,r.state=s.state,r.element=s.element,r.changes={},r.changes[e]=1,r.kind=n,setTimeout(e=>e.app.emitstate(e.cache.e),s.state.delay,s)),!0},e.input=function(e,t){return this.$inputs[e]=t,this},e.output=function(e,t){var n=this,i=(n.component.outputs||EMPTYARRAY).findItem('id',e);if(i)return t?'function'==typeof t?n.$outputs[e]=t:o(n,i,null,t):(t=n.$outputs[e])&&t((e,t)=>o(n,i,e,t)),n;console.error('UI Builder: Output "{0}" not found in the "{1}" component'.format(e,n.component.name))},e.family=function(e){var n=this,i=[],o=function(e){if(e.children)for(var t of e.children)i.push(t),n.component.scope||o(t)};if(null!=e){'object'==typeof e&&(e=ATTRD(e,'index'));e=n.containers?n.containers['container'+e]:null;if(e)for(var t of e)i.push(t),o(t)}else o(n);return i},e.remove=function(){this.element.remove(),this.app.clean()},e.readvalue=function(e){if(!e)return this.state.value;e=this.find(e);return e?e.state.value:null},e.view=function(e,t,n){return e&&('function'==typeof t&&(n=t,t=null),'#'===e.charAt(0)&&(e=e.substring(1)),this.app.view(e,t,n)),this},e.datasource=function(e,t){var n=this;if(!e)return n;function i(e){e&&(e=!(e instanceof Array)&&e.items instanceof Array?e.items:e)instanceof Array&&t(CLONE(e))}var o=e.charAt(0);return'#'===o?n.view(e,null,t):'@'===o?(o=n.find(e))&&(o.on('value',i),i(o.state.value)):n.clfind(e,i),n},e.clfind=function(t,n,i){var o=this;if('function'==typeof n&&(i=n,n=''),!i)return new Promise(e=>o.app.clfind(t,n,e));var e=t.charAt(0);if('#'!==e){if('@'!==e)return o.app.clfind(t,n,i),o;e=o.find(t);if(e&&e.state.value instanceof Array){var r,s=[];n=n&&n.toSearch();for(r of e.state.value)!r.name||n&&-1===r.name.toSearch().indexOf(n)||s.push(r);i(s)}else i([])}else o.view(t,{search:n},function(e){e?(e.items instanceof Array&&(e=e.items),i(e)):i([])})},e.clread=function(t,n,i){var o=this;if(!i)return new Promise(e=>o.app.clread(t,n,e));var e=t.charAt(0);if('#'!==e){if('@'!==e)return o.app.clread(t,n,i),o;(e=o.find(n))&&e.state.value instanceof Array?i(e.state.value.findItem('id',n)):i(null)}else o.view(t,{id:n},function(e){e?(e=e.items instanceof Array?e.items:e)instanceof Array?i(e.findItem('id',n)):i(e):i(null)})},e.find=function(e){return this.app.instances.findItem('id','@'===e.charAt(0)?e.substring(1):e)},e.hidden=function(){return HIDDEN(this.dom)},e.reset=function(){return this.events.reset&&this.emit('reset'),this},e.reconfigure=function(e){var t=this,n={};if(e)for(var i in e){var o=t.config[i],r=e[i];r!==o&&(n[i]=o,t.config[i]=r)}return t.events.configure&&t.emit('configure',n),t},e.get=function(e){return this.state[e||'value']},e.on=function(e,t){this.events[e]?this.events[e].push(t):this.events[e]=[t]},e.off=function(e,t){var n=this.events[e];return n&&(t?-1!==(t=n.indexOf(t))&&(n.splice(t,1),n.length||delete this.events[e]):delete this.events[e]),this},e.emit=function(e,t,n,i,o,r){e=this.events[e];if(e)for(var s of e)s.call(this,t,n,i,o,r)},e.bindable=function(e){return(!this.config.path||'@'!==this.config.path.charAt(0))&&this.config.path===e},e.write=function(e,t,n){if(!t||'@'===t.charAt(0))return n;for(var i=t.split('.'),o=0;o<i.length-1;o++){var r=e[i[o]];e=r=null==r?e[i[o]]={}:r}return e[i[o]]=n,e},e.include=function(o,f,r){var u=this,p=[];return(f.import||EMPTYARRAY).wait(function(e,t){v.cache[e]?t():(v.cache[e]=1,IMPORT(e,t))},function(){var l=Object.keys(f.components);l.wait(function(s,a){if(u.app.components[s])a();else{var e=f.components[s];if('string'==typeof e){var c=((t=e.split(' '))[1]||'').trim(),t=t[0].trim();if(c||(c=t,t=''),'base64'!==(t=t&&'.'===t.charAt(0)?t.substring(1):t))t&&'html'!==t&&'json'!==t||(v.editor&&'/'===c.charAt(0)&&(c=(v.origin||'')+c),AJAX('GET '+c.format(s),function(e,t){if(t)return console.error('UI Builder:',c,t),void a();if(ERROR(e))return console.error('UI Builder:',c,e),void a();if('object'!=typeof e){var t='@'===e.charAt(0),n=(t&&(e=e.substring(1)),v.parsehtml(e));try{var i={};if(i.id=s,i.isexternal=t,i.cls=u.app.class+'_'+HASH(i.id).toString(36),n.css&&(i.css=n.css),n.readme&&(i.readme=n.readme),n.html&&(i.html=n.html.replace(d,i.cls)),n.settings&&(i.settings=n.settings.replace(d,i.cls)),new Function('exports',n.js.replace(d,i.cls))(i),i.components)for(var o in i.components)f.components[o]||(f.components[o]=i.components[o],l.push(o));var r=c.indexOf('/',10);-1!==r&&(i.render&&'/'===i.render.charAt(0)&&(i.render=c.substring(0,r)+i.render),i.settings&&'/'===i.settings.charAt(0)&&(i.settings=c.substring(0,r)+i.settings)),p.push({name:s,fn:i})}finally{a()}}else{for(var o in e)f.components[o]||(f.components[o]='@'+e[o],l.push(o));a()}}));else try{var n=v.parsehtml(decodeURIComponent(atob(c))),i={};if(i.id=s,i.cls=u.app.class+'_'+HASH(i.id).toString(36),n.css&&(i.css=n.css),n.html&&(i.html=n.html.replace(d,i.cls)),new Function('exports',n.js.replace(d,i.cls))(i),i.components)for(var o in i.components)f.components[o]||(f.components[o]=i.components[o],l.push(o));p.push({name:s,fn:i})}finally{a()}}else p.push({name:s,fn:e}),a()}},function(){var e=p.splice(0),i=[];e.wait(function(e,t){var n=null;'function'==typeof e.fn?((n={}).id=e.name,n.cls=u.app.class+'_'+HASH(n.id).toString(36),e.fn(n)):n=e.fn,(u.app.components[e.name]=n).css&&i.push(n.css.replace(d,n.cls)),n.import instanceof Array?n.import.wait(function(e,t){v.cache[e]?t():(v.cache[e]=1,IMPORT(e,t))},t):t()},function(){var e;f.css&&i.unshift(f.css.replace(d,u.app.class)),i.length&&(e=u.app.class+'_'+GUID(5),CSS(i.join('\n'),e),u.removecss||(u.removecss=[]),u.removecss.push(e));for(var t,n=0;n<f.children.length;n++)for(t of f.children[n])u.app.compile(o,t,n);r&&r()})},3)}),u},e.watch=function(e,t,n){'function'==typeof t&&(n=t,t='value');e=this.app.instances.findItem('id',e);return e&&e.on(t,n),this},e.read=function(e,t){if(!t||'@'===t.charAt(0))return e;for(var n=t.split('.'),i=0;i<n.length;i++)if(!(e=e[n[i]]))return;return e},e.replace=e.variables=function(e,o,r){var s=this;return e.replace(/\{[a-z0-9_\.-]+\}/gi,function(e){var t=e.substring(1,e.length-1).trim(),n='',i=t.substring(0,4);if('user'===i)W.user&&(n=-1===(t=t.substring(5)).indexOf('.')?W.user[t]:s.read(W.user,t));else if('args'===i)t=t.substring(5),n=s.args[t];else if('data'===i)o&&(n=-1===(t=t.substring(4)).indexOf('.')?o:s.read(o,t.substring(1)));else if('query'===t.substring(0,5)){if(-1===(t=t.substring(5)).indexOf('.'))return QUERIFY(s.query).substring(1);n=s.query[t.substring(1)]}if(null==n)return e;if('function'==typeof r)return r(n);switch(r){case'url':case'urlencode':case'encode':return encodeURIComponent(n);case'escape':case'html':return Thelpers.encode(n);case'json':return JSON.stringify(n)}return n})},e.wait=function(e,t){function n(){e()?t():setTimeout(n,300)}return n(),this},e.querify=function(e,t){return this.app.urlify(this.variables(t?QUERIFY(e,t):e))},e.urlify=function(e){return this.app.urlify(this.variables(e))},e.settings=function(){this.app.emit('settings',this),v.emit('settings',this)},v.version=1.8,v.selectors={component:'.UI_component',components:'.UI_components'},v.current='default',v.events={},v.apps={},v.cache={},v.resize=function(){for(var e in v.apps){var t;for(t of v.apps[e].instances)t.events.resize&&t.emit('resize')}},ON('resize + resize2',v.resize),v.on=function(e,t){this.events[e]?this.events[e].push(t):this.events[e]=[t]},v.emit=function(e,t,n,i,o,r){e=this.events[e];if(e)for(var s of e)s.call(this,t,n,i,o,r)},v.register=function(e,t){v.apps[v.current].pending.push({name:e,fn:t})};var g=function(e,t){var n=e.element,i=[];for(n of n.find(v.selectors.component+'[data-id="{0}"] {1}'.format(t,v.selectors.components)))(n=$(n)).closest(v.selectors.component).attrd('id')===t&&i.push({index:+n.attrd('index'),element:n});return i.quicksort('index'),i};function b(e,t,n,i,o,r,s){if('string'==typeof n){if(!this.components[n])return void console.error('UI Builder: The component "{0}" not found'.format(n));n={id:'cid'+Date.now().toString(36),component:n,children:[],config:n.config||{},gap:0!=n.gap}}if(r&&COPY(r,n),o)for(var a in o)n.config[a]=o[a];r=g(this,e);if(r.length)for(var c of r)c.index==t&&this.compile(c.element,n,t,i,null,s);return this.refreshio(),n}v.build=function(e,f,i){if(v.apps[f.id])return v.remove(f.id),void setTimeout(v.build,100,e,f,i);v.current=f.id;function t(){if(c=null,v.editor){u.inputs=[],u.outputs=[],u.list=[],u.zindex=1;for(var e of u.instances)if(e.dom.parentNode){e.component.floating&&(u.zindex=(e.element.css('z-index')||'').parseInt(),u.zindex<=0&&(u.zindex=1));var t=e.component.inputs,n=e.config.name||e.component.name;if(u.list&&u.list.push({id:e.id,name:n,icon:e.component.icon,color:e.component.color}),t)for(var i of t)u.inputs.push({id:e.id+'_'+i.id,ref:i.id,name:n+': '+i.name,componentid:e.component.id,component:n,input:i.name,icon:e.component.icon,color:e.component.color,note:i.note,schema:i.schema});if((t=e.component.outputs)&&t.length)for(var i of t)u.outputs.push({id:e.id+'_'+i.id,ref:i.id,name:n+': '+i.name,componentid:e.component.id,component:n,output:i.name,icon:e.component.icon,color:e.component.color,note:i.note,schema:i.schema})}}else u.outputs=u.inputs=u.schema=null;if(!u.ready){u.ready=!0,u.callback&&u.callback(u),s.rclass('invisible'),l(u);function o(e){e.state.init=1,e.events.ready&&e.emit('ready')}var r;for(r of u.instances)r.fork&&a(r,o),r.state.init=1,r.events.ready&&r.emit('ready');v.emit('app',u)}u.emit('io',u),v.emit('io',u)}var n=document.createElement('DIV'),s=$(n),u=(s.attrd('id',f.id),s.aclass('UI_app invisible'),s.empty(),$(e)[0].appendChild(n),{}),o=[],a=(u.id=v.current,u.components={},u.args=f.args||{},u.query=f.query||CLONE(NAV.query),u.schema=f,u.events={},u.cache={},u.compile=y,u.stringify=x,u.clean=r,u.add=b,u.remove=()=>v.remove(u.id),u.class='ui_'+HASH(v.current).toString(36),u.element=s,u.dom=s[0],u.pending=[],u.instances=[],u.removecss=[],f.urlify?u.urlify=f.urlify:u.urlify=e=>e,s.aclass(u.class),v.view?u.view=v.view:u.view=function(e,t,n){n(EMPTYARRAY)},v.clfind?u.clfind=v.clfind:u.clfind=function(e,t,n){n(EMPTYARRAY)},v.clread?u.clread=v.clread:u.clread=function(e,t,n){n(EMPTYOBJECT)},u.on=p.prototype.on,u.emit=p.prototype.emit,u.emitstate=p.prototype.emitstate,u.intervalcounter=0,u.interval&&clearInterval(u.interval),u.interval=setInterval(function(t){if(W.inDOM(t.dom)){t.intervalcounter++;var e,n=e=>e.events.service&&e.emit('service',t.intervalcounter);for(e of t.instances)e.events.service&&e.emit('service',t.intervalcounter),e.fork&&a(e,n)}else t.remove()},6e4,u),u.recompile=function(){u.clean();for(var e,t=0;t<u.schema.children.length;t++)for(e of u.schema.children[t])e.protected=!0,u.compile(u.element,e,t)},u.build=function(e,t,n){t.urlify=u.urlify,v.build(e,t,n)},function(e,t){for(var n of e.fork.instances)t(n),n.fork&&a(n,t)}),c=null;return u.refreshio=function(e){e?t():(c&&clearTimeout(c),c=setTimeout(t,100))},u.input=function(e,t,n){n=n||NOOP;var i=e.indexOf('_'),o=e.substring(0,i),e=e.substring(i+1),i=u.instances.findItem('id',o);i?(i=i.$inputs[e])?i(t,n):n('Input "{0}" not found'.format(e)):n('Instance "{0}" not found'.format(o))},u.output=function(e){i=i||NOOP;var t=e.indexOf('_'),n=e.substring(0,t),e=e.substring(t+1),t=u.instances.findItem('id',n);t?t.output(e):i('Instance "{0}" not found'.format(n))},v.apps[v.current]=u,(f.import||EMPTYARRAY).wait(function(e,t){v.cache[e]?t():(v.cache[e]=1,IMPORT(e,t))},function(){var l=Object.keys(f.components);l.wait(function(r,s){var e=f.components[r];if('string'==typeof e){var a,c=((t=e.split(' '))[1]||'').trim(),t=t[0].trim();if(c||(c=t,t=''),'base64'!==(t=t&&'.html'===t.charAt(0)?t.substring(1):t))t&&'html'!==t||((a='@'===(c=v.editor&&'/'===c.charAt(0)?(v.origin||'')+c:c).charAt(0))&&(c=c.substring(1)),AJAX('GET '+c.format(r),function(e,t){if(t)return console.error('UI Builder:',c,t),void s();if(ERROR(e))return console.error('UI Builder:',c,e),void s();if('object'!=typeof e){t=v.parsehtml(e);try{var n={};if(n.id=r,n.isexternal=a,n.cls=u.class+'_'+HASH(n.id).toString(36),t.css&&(n.css=t.css),t.readme&&(n.readme=t.readme),t.html&&(n.html=t.html.replace(d,n.cls)),t.settings&&(n.settings=t.settings.replace(d,n.cls)),new Function('exports',t.js.replace(d,n.cls))(n),n.components)for(var i in n.components)f.components[i]||(f.components[i]=n.components[i],l.push(i));var o=c.indexOf('/',10);-1!==o&&(n.render&&'/'===n.render.charAt(0)&&(n.render=c.substring(0,o)+n.render),n.settings&&'/'===n.settings.charAt(0)&&(n.settings=c.substring(0,o)+n.settings)),u.pending.push({name:r,fn:n})}finally{s()}}else{for(var i in e)f.components[i]||(f.components[i]='@'+e[i],l.push(i));s()}}));else try{var n={},i=(n.id=r,n.cls=u.class+'_'+HASH(n.id).toString(36),v.parsehtml(decodeURIComponent(atob(c))));if(i.css&&(n.css=i.css),i.html&&(n.html=i.html.replace(d,n.cls)),new Function('exports',i.js.replace(d,n.cls))(n),n.components)for(var o in n.components)f.components[o]||(f.components[o]=n.components[o],l.push(o));u.pending.push({name:r,fn:n})}finally{s()}}else u.pending.push({name:r,fn:e}),s()},function(){u.pending.splice(0).wait(function(e,t){var n=null;'function'==typeof e.fn?((n={}).id=e.name,n.cls=u.class+'_'+HASH(n.id).toString(36),e.fn(n)):n=e.fn,(u.components[e.name]=n).css&&o.push(n.css.replace(d,n.cls)),n.import instanceof Array?n.import.wait(function(e,t){v.cache[e]?t():(v.cache[e]=1,IMPORT(e,t))},t):t()},function(){f.css&&o.unshift(f.css.replace(d,u.class)),CSS(o,u.class);for(var e,t=0;t<f.children.length;t++)for(e of f.children[t])e.protected=!0,u.compile(s,e,t);u.callback=i})},1)}),u},v.parsehtml=function(e){var t='';if(-1===e.indexOf('<script>'))return{js:e};var n,i='',o='',t='',r='',s='',a=e.indexOf('<settings>');return-1!==a&&(n=e.indexOf('</settings>',a+10),i=e.substring(a+8,n).trim(),e=e.substring(0,a)+e.substring(n+11)),-1!==(a=e.indexOf('<style>'))&&(t=e.substring(a+7,e.indexOf('</style>',a+7))),-1!==(a=e.indexOf('<body>'))&&(s=e.substring(a+6,e.indexOf('</body>',a+6))),-1!==(a=e.indexOf('<readme>'))&&(o=e.substring(a+8,e.indexOf('</readme>',a+8))),-1!==(a=e.indexOf('<script>'))&&(n=e.indexOf('<\/script>',a+8),r=e.substring(a+8,n).trim()),{js:r,css:t,settings:i,readme:o,html:s}},v.remove=function(t){var n=v.apps[t];if(n){n.interval&&clearInterval(n.interval),n.interval=null;for(var e of n.instances){if(e.removecss)for(var i of e.removecss)CSS('',i);e.events.destroy&&e.emit('destroy')}setTimeout(function(){for(var e in n.components){e=n.components[e];e.uninstall&&e.uninstall()}n.tmp=null,CSS('',n.class),n.element.remove(),delete v.apps[t]},2)}};var u=null,h=document;function k(n,i,e){var t,o,r,s,a,c,l=(n=!(n instanceof jQuery)?$(n):n).closest('.UI_component')[0];!l||l.uibuilder.meta.readonly||l.uibuilder.forked||(null==(i=i||{}).format&&(i.format=!0),i.format&&null==i.icon&&(i.icon=!0),e&&(i.callback=e),u?u.element[0]!=n[0]&&(u.close(),setTimeout(k,100,n,i,e)):(i.backup=n.html(),i.html&&n.html(i.html),n.attr('contenteditable',!0),n.aclass('UI_editing'),(u={}).element=n,u.dom=n[0],u.instance=l.uibuilder,u.parent=i.parent?i.parent[0]:u.dom,u.createlink=function(){if(function(e){if(h.selection&&'Text'===h.selection.type)return h.selection.createRange().htmlText;if(W.getSelection){var t=W.getSelection();if(!t.rangeCount)return'';for(var n=h.createElement('div'),i=0,o=t.rangeCount;i<o;++i)n.appendChild(t.getRangeAt(i).cloneContents());return e?n:n.innerHTML}}().trim()){for(var e=u.element,t='#link'+Date.now().toString(36),n=e[0],i=0;i<5;i++){if('A'===n.tagName)return;if(!(n=n.parentNode))break}document.execCommand('CreateLink',!1,t);var o,e=e.find('a[href="'+t+'"]');e.length&&(u&&u.close(),t=e.text(),o='',e.aclass('UI_link'),-1!==t.indexOf('@')?o='mailto:'+t:/\d+/.test(t)?o='tel:'+t:-1===t.indexOf(' ')&&-1===t.indexOf(',')&&-1!==t.indexOf('.')&&(o=/http(s):\/\//.test(t)?t:'https://'+t),t=-1!==o.indexOf('.')&&-1===o.indexOf(location.hostname)?'_blank':'',e.attr('href',o||'#'),e.attr('target',t),v.emit('link',e))}},t=function(){u.close()},o=function(e){e.target===u.parent||u.parent.contains(e.target)||u.close()},r=function(e){e.preventDefault();e=(e.originalEvent||e).clipboardData.getData('text/plain');document.execCommand('insertHTML',!1,e)},s=function(e){if(i.keydown&&i.keydown(e),27===e.keyCode)return e.preventDefault(),e.stopPropagation(),u.key=27,void u.close();if(i.backslashremove&&8===e.keyCode&&!n.text().trim())return u.key=8,void u.close();if(13!==e.keyCode){if(9===e.keyCode)return i.tabs?(e.preventDefault(),void document.execCommand('insertHTML',!1,'&#009')):(i.endwithtab?(e.preventDefault(),u.key=9):(e.preventDefault(),e.stopPropagation()),void u.close());if(u.change=!0,e.metaKey||e.ctrlKey)if(66!==e.keyCode)if(76!==e.keyCode)if(73!==e.keyCode){var t;if(80===e.keyCode)return i.format&&!0===i.icon&&(t='<i class="ti ti-totaljs UI_icon" contenteditable="false"></i>','span'===n[0].nodeName.toLowerCase()?n.parent().prepend(t):document.execCommand('insertHTML',!1,t)),e.preventDefault(),void e.stopPropagation();85!==e.keyCode?32===e.keyCode&&(document.execCommand('insertHTML',!1,'&nbsp;'),e.preventDefault(),e.stopPropagation()):i.format&&!1!==i.underline||(e.preventDefault(),e.stopPropagation())}else i.format&&!1!==i.italic||(e.preventDefault(),e.stopPropagation());else i.format&&!1!==i.link?u.createlink():(e.preventDefault(),e.stopPropagation());else i.format&&!1!==i.bold||(e.preventDefault(),e.stopPropagation())}else i.multiline&&!e.shiftKey||(e.preventDefault(),e.stopPropagation(),u.key=13,u.close())},n.focus(),'end'===i.cursor&&((e=document.createRange()).selectNodeContents(n[0]),e.collapse(!1),(l=W.getSelection()).removeAllRanges(),l.addRange(e)),u.close=function(){var e;$(W).off('click',o),n.rattr('contenteditable'),n.off('keydown',s),n.off('contextmenu',t),n.off('paste',r),n.rclass('UI_editing'),i.callback&&((e={}).text=n.text().trim(),e.html=n.html(),e.change=u.change,e.element=u.element,e.dom=u.dom,e.backup=i.backup,e.key=u.key,e.param=i.param,i.callback(e)),u.timeout&&clearTimeout(u.timeout),u=null},a=i.placeholder,c=!1,u.checkplaceholder=function(){var e;a&&(e=0<n[0].innerHTML.length,c!==e&&(c=e,a.classList.toggle('hidden',e)))},$(W).on('click',o),n.on('keydown',s),n.on('contextmenu',t),i.placeholder&&a&&n.on('input',u.checkplaceholder),n.on('paste',r)))}function x(e,u){var t,p=this,d='function'==typeof e?e:null,n=(e=d?null:e)||p.element.find('> '+v.selectors.component),i=[],m=[],h={};for(t of n){var o={children:[]};i.push(o),function e(t,n){var i,o,r,s=n.uibuilder;if(t.id=n.getAttribute('data-id'),t.component=s.component.id,t.config=CLONE(s.config),h[s.component.id]||(i=p.schema.components[s.component.id])&&(h[s.component.id]=i),s.component.floating&&(o=(i=$(n)).position(),t.x=o.left,t.y=o.top,t.zindex=i.css('z-index')||m.length,t.zindex=+t.zindex,t.zindex<=0&&(t.zindex=1)),!d||d(t)){if(m.push(s),n.classList.contains('UI_gap')&&(t.gap=!0),s.children=[],!s.component.children)for(r of g(p,t.id)){var a,c=[],f=r.element.find('> '+v.selectors.component);t.children||(t.children=[]),t.children.push(c);for(a of f){var l={children:[]};c.push(l),s.children.push(a.uibuilder),e(l,a)}}s.events.stringify&&s.emit('stringify',t,u)}}(o,t)}i=e?i[0]:[i];return{instances:m,children:i,components:h}}}(W.UIBuilder={});