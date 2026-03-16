<?php

//上传配置
return [
    /**
     * 上传地址,默认是本地上传
     */
    'uploadurl' => 'ajax/upload',
    /**
     * CDN地址
     */
    'cdnurl'    => '',
    /**
     * 文件保存格式
     */
    'savekey'   => '/uploads/{year}{mon}{day}/{filemd5}{.suffix}',
    /**
     * 最大可上传大小
     */
    'maxsize'   => '10mb',
    /**
     * 可上传的文件类型
     * 如配置允许 pdf,ppt,docx,svg 等可能含有脚本的文件时，请先从服务器配置此类文件直接下载而不是预览
     * 此处已额外开放 txt,csv,xls,xlsx 以支持导入券码
     */
    // 允许上传的文件类型
    // 补充了常见办公文档类型：doc, docx, ppt, pptx
    'mimetype'  => 'jpg,png,bmp,jpeg,gif,webp,zip,rar,wav,mp4,mp3,webm,pdf,txt,csv,xls,xlsx,doc,docx,ppt,pptx',
    /**
     * 是否支持批量上传
     */
    'multiple'  => false,
    /**
     * 上传超时时长，这里仅用于JS上传超时控制
     */
    'timeout'  => 60000,
    /**
     * 是否支持分片上传
     */
    'chunking'  => false,
    /**
     * 默认分片大小
     */
    'chunksize' => 2097152,
    /**
     * 完整URL模式
     * 开启后，前端接收到的上传结果会使用包含域名的完整 URL，
     * 便于小程序等前端直接访问，例如 http://域名/uploads/xxx.png
     */
    'fullmode' => true,
    /**
     * 缩略图样式
     */
    'thumbstyle' => '',
];
