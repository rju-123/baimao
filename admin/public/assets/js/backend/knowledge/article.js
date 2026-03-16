define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'upload'], function ($, undefined, Backend, Table, Form, Upload) {

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'knowledge/article/index',
                    add_url: 'knowledge/article/add',
                    edit_url: 'knowledge/article/edit',
                    del_url: 'knowledge/article/del',
                    multi_url: 'knowledge/article/multi',
                    table: 'knowledge_articles',
                }
            });

            var table = $("#table");

            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id'), sortable: true},
                        {field: 'title', title: '标题', operate: 'LIKE'},
                        {field: 'summary', title: '摘要', operate: 'LIKE'},
                        {
                            field: 'status',
                            title: '状态',
                            searchList: {draft: '草稿', published: '上架'},
                            formatter: Table.api.formatter.normal
                        },
                        {field: 'createtime', title: __('Createtime'), operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate: false, formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            Table.api.bindevent(table);
        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                var form = $("form[role=form]");
                Form.api.bindevent(form);

                // 附件上传：支持多文件，并自动把本地文件名写入附件名称输入框
                var $attachBtn = $(".plupload[data-input-id='c-attachment_url']", form);
                if ($attachBtn.length) {
                    $attachBtn.data("upload-success", function (data) {
                        // Upload.api.send / Upload.api.upload 返回的 data 中通常包含 url/fullurl/filename/originalname
                        var nameFromData = data.originalname || data.filename || data.name || "";
                        // Dropzone 的 file.name 也常常作为 original filename，这里兜底使用 data.data.file.name 之类的情况
                        if (!nameFromData && data.file && data.file.name) {
                            nameFromData = data.file.name;
                        }
                        if (!nameFromData) {
                            return;
                        }
                        var $nameInput = $("#c-attachment_name");
                        if (!$nameInput.length) {
                            return;
                        }
                        var current = $.trim($nameInput.val());
                        if (current) {
                            // 已有名称时，追加，逗号分隔，方便表示多个附件
                            $nameInput.val(current + "," + nameFromData);
                        } else {
                            $nameInput.val(nameFromData);
                        }
                    });
                }

                var $textarea = $("#c-content");
                if (!$textarea.length) {
                    return;
                }
                if ($textarea.data("richeditor-initialized")) {
                    return;
                }

                var initialHtml = $textarea.val() || "";

                var $toolbar = $('<div class="btn-group" style="margin-bottom:5px;">\
                    <button type="button" class="btn btn-default btn-sm" data-command="bold"><i class="fa fa-bold"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="italic"><i class="fa fa-italic"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="underline"><i class="fa fa-underline"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="insertUnorderedList"><i class="fa fa-list-ul"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="insertOrderedList"><i class="fa fa-list-ol"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="justifyLeft"><i class="fa fa-align-left"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="justifyCenter"><i class="fa fa-align-center"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="justifyRight"><i class="fa fa-align-right"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="createLink"><i class="fa fa-link"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="insertImage"><i class="fa fa-image"></i></button>\
                    <button type="button" class="btn btn-default btn-sm" data-command="removeFormat"><i class="fa fa-eraser"></i></button>\
                </div>');

                var $editor = $('<div id="c-content-editor" contenteditable="true" class="form-control" style="min-height:260px;overflow:auto;border:1px solid #d2d6de;"></div>');
                $editor.html(initialHtml.replace(/\n/g, "<br>"));

                $textarea.after($editor).before($toolbar);
                $textarea.hide();

                // 本地图片上传用的隐藏 input，只在当前页面使用
                var $imageInput = $('<input type="file" accept="image/*" style="display:none;">');
                $("body").append($imageInput);

                $imageInput.on("change", function () {
                    var file = this.files && this.files[0];
                    if (!file) {
                        return;
                    }
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        $editor.focus();
                        // 使用 dataURL 插入图片
                        document.execCommand("insertImage", false, e.target.result);

                        // 对刚插入的图片增加可拖拽缩放功能
                        var $imgs = $editor.find("img");
                        if ($imgs.length) {
                            var $lastImg = $imgs.last();
                            makeImageResizable($lastImg);
                        }
                        // 清空 input，避免选择同一张图时不触发 change
                        $imageInput.val("");
                    };
                    reader.readAsDataURL(file);
                });

                $toolbar.on("click", "button[data-command]", function () {
                    var cmd = $(this).data("command");
                    var value = null;
                    if (cmd === "createLink") {
                        value = window.prompt("请输入链接地址（URL）:", "https://");
                        if (!value) {
                            return;
                        }
                    } else if (cmd === "insertImage") {
                        // 触发本地图片选择，由 change 事件完成插入逻辑
                        $imageInput.trigger("click");
                        return;
                    }
                    $editor.focus();
                    document.execCommand(cmd, false, value);
                });

                // 编辑内容时，实时同步到隐藏的 textarea，并触发表单校验
                var syncToTextarea = function () {
                    var rawHtml = $editor.html() || "";
                    // 去掉纯空标签、换行和空格，用于判断是否为空
                    var textForCheck = rawHtml
                        .replace(/<br\s*\/?>/gi, "")
                        .replace(/<\/?p[^>]*>/gi, "")
                        .replace(/&nbsp;/gi, " ")
                        .replace(/\s+/g, "")
                        .trim();
                    if (!textForCheck) {
                        $textarea.val("");
                    } else {
                        $textarea.val(rawHtml);
                    }
                    $textarea.trigger("change").trigger("validate");
                };

                $editor.on("input blur keyup", function () {
                    syncToTextarea();
                });

                // 处理从 Word 等粘贴进来的内容与图片：
                // - 如果剪贴板中有真实的图片文件：阻止默认粘贴，走附件上传接口并插入图片
                // - 如果没有图片文件：保持浏览器默认粘贴行为（文字/HTML），避免影响普通粘贴体验
                $editor.on("paste", function (event) {
                    var originEvent = event.originalEvent || event;
                    var clipboardData = originEvent.clipboardData || originEvent.clipboard || window.clipboardData;
                    if (!clipboardData || !clipboardData.items) {
                        return;
                    }
                    var items = clipboardData.items;
                    var hasImageFile = false;
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        if (item.kind === 'file' && item.type && item.type.indexOf('image/') === 0) {
                            hasImageFile = true;
                            var file = item.getAsFile && item.getAsFile();
                            if (!file) {
                                continue;
                            }
                            // 找到图片文件后，拦截默认粘贴，统一走上传通道
                            event.preventDefault();

                            // 通过 Upload.api.send 走与附件相同的上传通道
                            Upload.api.send(file, function (data) {
                                // 始终使用完整 URL，保证在小程序等环境下可以直接访问
                                var url = data.fullurl || Fast.api.cdnurl(data.url, true);
                                $editor.focus();
                                document.execCommand("insertImage", false, url);
                                var $imgs = $editor.find("img");
                                if ($imgs.length) {
                                    makeImageResizable($imgs.last());
                                }
                                // 同步到 textarea，保证校验通过
                                var rawHtml = $editor.html() || "";
                                $textarea.val(rawHtml);
                                $textarea.trigger("change").trigger("validate");
                            }, function () {
                                Toastr.error("图片上传失败，请稍后重试");
                            }, null, {
                                mimetype: 'image/gif,image/jpeg,image/png,image/jpg'
                            });
                        }
                    }
                    // 如果没有检测到图片文件，则不调用 preventDefault，走浏览器默认粘贴逻辑
                });

                // 点击已有图片时，也确保具备拖拽缩放能力
                $editor.on("click", "img", function () {
                    makeImageResizable($(this));
                });

                // 为图片增加拖拽缩放能力
                function makeImageResizable($img) {
                    if ($img.data("resizable-initialized")) {
                        return;
                    }

                    // 包一层容器，方便放置缩放拖拽手柄
                    if (!$img.parent().hasClass("rich-image-wrapper")) {
                        var $wrapper = $('<span class="rich-image-wrapper" style="position:relative;display:inline-block;max-width:100%;">');
                        $img.after($wrapper);
                        $wrapper.append($img);
                    }

                    var $wrapperParent = $img.parent();
                    var $handle = $('<span class="img-resize-handle" style="position:absolute;right:-4px;bottom:-4px;width:8px;height:8px;border:1px solid #333;background:#fff;cursor:se-resize;z-index:10;"></span>');
                    $wrapperParent.append($handle);

                    $img.css({
                        maxWidth: "100%",
                        height: "auto",
                        display: "block"
                    });

                    $img.data("resizable-initialized", true);

                    $handle.on("mousedown", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var startX = e.pageX;
                        var startY = e.pageY;
                        var startWidth = $img.width();
                        var startHeight = $img.height();

                        function onMouseMove(ev) {
                            var diffX = ev.pageX - startX;
                            var diffY = ev.pageY - startY;
                            var newWidth = Math.max(50, startWidth + diffX);
                            var newHeight = Math.max(50, startHeight + diffY);
                            $img.css({
                                width: newWidth + "px",
                                height: newHeight + "px"
                            });
                        }

                        function onMouseUp() {
                            $(document).off("mousemove.richimg").off("mouseup.richimg");
                        }

                        $(document).on("mousemove.richimg", onMouseMove);
                        $(document).on("mouseup.richimg", onMouseUp);
                    });
                }

                form.on("submit", function () {
                    $textarea.val($editor.html());
                });

                $textarea.data("richeditor-initialized", true);
            }
        }
    };
    return Controller;
});

