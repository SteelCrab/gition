const TextBlock = ({ id, content, onUpdate }) => (
    <div className="group relative py-1 my-1">
        <p
            className="text-[16px] text-[#37352f] leading-[1.6] whitespace-pre-wrap outline-none"
            contentEditable
            onInput={(e) => onUpdate(id, e.currentTarget.innerText)}
            suppressContentEditableWarning
        >
            {content}
        </p>
    </div>
);

export default TextBlock;
