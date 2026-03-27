define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    // 列表文本展示长度限制：最多 15 个中文字符（超出省略）
    function limitText(value, maxLen) {
        var text = value == null ? '' : String(value);
        if (!text) return '-';
        var plain = text.replace(/\s+/g, ' ').trim();
        if (!plain) return '-';
        if (plain.length <= maxLen) return $('<div/>').text(plain).html();
        var shortText = plain.slice(0, maxLen) + '...';
        var escaped = $('<div/>').text(shortText).html();
        var fullEscaped = $('<div/>').text(plain).html();
        return '<span title="' + fullEscaped + '">' + escaped + '</span>';
    }

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'product/product/index',
                    add_url: 'product/product/add',
                    edit_url: 'product/product/edit',
                    del_url: 'product/product/del',
                    multi_url: 'product/product/multi',
                    table: 'product',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id'), sortable: true},
                        {field: 'name', title: __('Name'), operate: 'LIKE', formatter: function (value) { return limitText(value, 15); }},
                        {
                            field: 'type',
                            title: __('Type'),
                            searchList: {redteam: '红队检测', pentest: '渗透测试', other: '其他产品'},
                            formatter: function (value) {
                                var map = {redteam: '红队检测', pentest: '渗透测试', other: '其他产品'};
                                return map[value] || value || '-';
                            }
                        },
                        // 去掉“分类”字段，改为显示客户字段
                        {field: 'customer', title: __('Customer'), operate: 'LIKE', formatter: function (value) { return limitText(value, 15); }},
                        {field: 'brief', title: __('Brief'), operate: 'LIKE', formatter: function (value) { return limitText(value, 15); }},
                        {field: 'price', title: __('Price'), operate: 'BETWEEN'},
                        {field: 'discount_price', title: __('Discount price'), operate: 'BETWEEN'},
                        {field: 'inventory', title: __('Inventory'), operate: 'BETWEEN'},
                        {field: 'status', title: __('Status'), searchList: {active: __('Active'), expired: __('Expired')}, formatter: Table.api.formatter.status},
                        {field: 'createtime', title: __('Createtime'), operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            // 为表格绑定事件
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
                Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});

