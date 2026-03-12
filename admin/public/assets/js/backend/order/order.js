define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'order/order/index',
                    add_url: 'order/order/add',
                    edit_url: 'order/order/edit',
                    del_url: 'order/order/del',
                    multi_url: 'order/order/multi',
                    table: 'order',
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
                        {field: 'order_no', title: __('Order no'), operate: 'LIKE'},
                        {field: 'sales_name', title: __('Sales name'), operate: 'LIKE'},
                        {field: 'product_name', title: __('Product name'), operate: 'LIKE'},
                        {field: 'product_customer', title: __('Product customer'), operate: 'LIKE'},
                        {field: 'quantity', title: __('Quantity')},
                        {field: 'pay_amount', title: __('Pay amount'), operate: 'BETWEEN'},
                        {field: 'whitehat_name', title: __('Whitehat name'), operate: 'LIKE'},
                        {
                            field: 'contract_status',
                            title: __('Contract status'),
                            searchList: {none: __('Contract none'), uploaded: __('Contract uploaded')},
                            formatter: Table.api.formatter.status
                        },
                        {
                            field: 'status',
                            title: __('Status'),
                            searchList: {
                                pending_contract: __('Pending contract'),
                                pending_fulfillment: __('Pending fulfillment'),
                                in_progress: __('In progress'),
                                completed: __('Completed'),
                                cancelled: __('Cancelled')
                            },
                            formatter: Table.api.formatter.status
                        },
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

