<?php

namespace app\admin\model;

use think\Model;

/**
 * 知识库文章
 */
class KnowledgeArticle extends Model
{
    // 表名（去掉前缀，FastAdmin 会自动加上 `fa_` 前缀）
    protected $name = 'knowledge_articles';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    // 追加属性（预留）
    protected $append = [];

    public function getStatusList()
    {
        return [
            'draft' => __('Draft'),
            'published' => __('Published'),
        ];
    }

    public function getAttachmentPositionList()
    {
        return [
            'head' => __('Head'),
            'tail' => __('Tail'),
        ];
    }
}

