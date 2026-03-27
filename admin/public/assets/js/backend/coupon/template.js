define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'coupon/template/index',
                    add_url: 'coupon/template/add',
                    edit_url: 'coupon/template/edit',
                    del_url: 'coupon/template/del',
                    table: 'coupon_templates',
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
                        {field: 'code', title: '优惠券编号', operate: 'LIKE'},
                        {field: 'name', title: '优惠券名称', operate: 'LIKE'},
                        {
                            field: 'type',
                            title: '优惠类型',
                            searchList: {amount: '满减', discount: '折扣', direct: '直减'},
                            formatter: Table.api.formatter.normal
                        },
                        {field: 'value', title: '面额/折扣', operate: 'BETWEEN'},
                        {field: 'minAmount', title: '使用门槛', operate: 'BETWEEN'},
                        {field: 'validFrom', title: '有效期开始', operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'validTo', title: '有效期结束', operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'totalQuantity', title: '计划发放量', operate: 'BETWEEN'},
                        {
                            field: 'status',
                            title: '状态',
                            searchList: {not_started: '未开始', in_progress: '进行中', ended: '已结束'},
                            formatter: Table.api.formatter.normal
                        },
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            $(document).on('click', '.btn-allocate', function () {
                var ids = Table.api.selectedids(table);
                if (ids.length !== 1) {
                    Toastr.warning('请选择一条记录');
                    return;
                }
                var url = $(this).data('url') + '?ids=' + ids[0];
                Fast.api.open(url, '发放优惠券', {
                    area: ['600px', '400px']
                });
            });

            Table.api.bindevent(table);
        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        allocate: function () {
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
