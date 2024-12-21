USE SUSUSHISHI
GO

CREATE PROCEDURE getUserIdByAccount 
    @USERNAME NVARCHAR(50)
AS
BEGIN
    SELECT 
		AC.PASSWORD,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN AC.EMPLOYEE_ID
            ELSE AC.CUSTOMER_ID 
        END AS Id,
        AC.ROLE,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN E.FULL_NAME
            ELSE C.FULL_NAME
        END AS Name
    FROM ACCOUNT AC
    LEFT JOIN EMPLOYEE E ON AC.EMPLOYEE_ID = E.EMPLOYEE_ID
    LEFT JOIN CUSTOMER C ON AC.CUSTOMER_ID = C.CUSTOMER_ID
    WHERE AC.USERNAME = @USERNAME 
END

GO
CREATE PROC getMenuDropDownItem
AS
BEGIN
    -- T?o b?ng t?m d? luu k?t qu?
    CREATE TABLE #CategoryDish (
        CATEGORY_NAME NVARCHAR(50),
        DISH_NAME NVARCHAR(50)
    );

    -- L?y danh sách các món an theo CATEGORY_NAME
    INSERT INTO #CategoryDish (CATEGORY_NAME, DISH_NAME)
    SELECT 
        d.CATEGORY_NAME, 
        d.DISH_NAME
    FROM 
        (SELECT CATEGORY_NAME, DISH_NAME, ROW_NUMBER() OVER (PARTITION BY CATEGORY_NAME ORDER BY DISH_ID) AS RowNum 
         FROM DISH) d
    WHERE 
        d.RowNum <= 4; -- L?y t?i da 4 món an trong m?i danh m?c

    -- Tr? v? k?t qu? nhóm các món an theo CATEGORY_NAME
    SELECT 
        CATEGORY_NAME,
        STRING_AGG(DISH_NAME, ', ') AS DISHES
    FROM 
        #CategoryDish
    GROUP BY 
        CATEGORY_NAME;

    -- Xóa b?ng t?m
    DROP TABLE #CategoryDish;
END;
GO


GO
CREATE PROC getRevenueByDate
	@DATE DATE,
	@BranchId CHAR(4)
AS
BEGIN
	SELECT * FROM INVOICE I
	JOIN ORDER_ O ON O.ORDER_ID = I.ORDER_ID AND O.BRANCH_ID = @BranchId
	WHERE I.ISSUE_DATE = @DATE
END

EXEC getRevenueByDate @DATE = '10-31-2019', @BranchId = 'B003'

select * from invoice
JOIN ORDER_ O ON O.ORDER_ID = invoice.ORDER_ID AND O.BRANCH_ID = 'B003'
GO
CREATE PROC getRevenueByMonth
    @Year INT,
    @Month INT,
    @BranchId CHAR(4)
AS
BEGIN
    SELECT *
    FROM INVOICE I
    JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID AND O.BRANCH_ID = @BranchId
    WHERE YEAR(I.ISSUE_DATE) = @Year AND MONTH(I.ISSUE_DATE) = @Month;
END;

EXEC getRevenueByMonth @Year = '1997', @Month = '7', @BranchId = 'B003'

GO
CREATE PROC getRevenueByQuarter
    @Year INT,
    @Quarter INT,
    @BranchId CHAR(4)
AS
BEGIN
    DECLARE @StartDate DATE;
    DECLARE @EndDate DATE;

    -- Tính toán ph?m vi ngày c?a quý
    IF @Quarter = 1
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-01-01'; -- Ngày b?t d?u quý 1
        SET @EndDate = CAST(@Year AS VARCHAR) + '-03-31'; -- Ngày k?t thúc quý 1
    END
    ELSE IF @Quarter = 2
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-04-01'; -- Ngày b?t d?u quý 2
        SET @EndDate = CAST(@Year AS VARCHAR) + '-06-30'; -- Ngày k?t thúc quý 2
    END
    ELSE IF @Quarter = 3
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-07-01'; -- Ngày b?t d?u quý 3
        SET @EndDate = CAST(@Year AS VARCHAR) + '-09-30'; -- Ngày k?t thúc quý 3
    END
    ELSE IF @Quarter = 4
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-10-01'; -- Ngày b?t d?u quý 4
        SET @EndDate = CAST(@Year AS VARCHAR) + '-12-31'; -- Ngày k?t thúc quý 4
    END

    -- Truy v?n các hóa don theo quý
    SELECT *
    FROM INVOICE I
    JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId
    AND I.ISSUE_DATE BETWEEN @StartDate AND @EndDate
END
SELECT * FROM INVOICE
EXEC getRevenueByQuarter @Year = 2022, @Quarter = 2, @BranchId = 'B003';

GO
CREATE PROC getRevenueByYear
	@Year INT,
    @BranchId CHAR(4)
AS
BEGIN
	SELECT *
	FROM INVOICE I
	JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId
	AND YEAR(I.ISSUE_DATE) = @Year
END


EXEC getRevenueByYear @Year = 2024, @BranchId = 'B003'
	SELECT *, D.DEPARTMENT_ID, D.DEPARTMENT_NAME
	FROM EMPLOYEE E
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = 'B003'
SELECT * FROM DEPARTMENT
select * from dish

UPDATE INVOICE
SET DISCOUNT_AMOUNT = (
    SELECT MS.DISCOUNT_AMOUNT
    FROM MEMBERSHIP_CARD MS
    JOIN CUSTOMER C ON C.CUSTOMER_ID = MS.CUSTOMER_ID
    JOIN ORDER_ O ON O.CUSTOMER_ID = C.CUSTOMER_ID
    WHERE INVOICE.ORDER_ID = O.ORDER_ID

);

SELECT * FROM MEMBERSHIP_CARD
UPDATE Invoice
SET FINAL_AMOUNT = (
    SELECT 
        CASE 
            WHEN SUM(od.QUANTITY * d.DISH_PRICE) - DISCOUNT_AMOUNT < 0 THEN 0
            ELSE SUM(od.QUANTITY * d.DISH_PRICE) - DISCOUNT_AMOUNT
        END
    FROM ORDER_DISH od
    JOIN DISH d ON od.DISH_ID = d.DISH_ID
    WHERE od.ORDER_ID = Invoice.ORDER_ID
);

GO
CREATE PROC getRatingByDate
	@DATE DATE,
	@BranchId CHAR(4),
	@EmployeeId CHAR(7)
AS
BEGIN
	SELECT E.EMPLOYEE_ID, E.FULL_NAME, AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND O.ORDER_DATE = @DATE
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE E.EMPLOYEE_ID = @EmployeeId
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME
END



EXEC getRatingByDate @DATE = '12-22-2018', @BranchId = 'B001', @EmployeeId = 'E014327'

GO
CREATE PROC getRatingByMonth
	@MONTH int,
	@YEAR int,
	@BranchId CHAR(4),
	@EmployeeId CHAR(7)
AS
BEGIN
	SELECT E.EMPLOYEE_ID, E.FULL_NAME, AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = @YEAR AND MONTH(O.ORDER_DATE) = @MONTH
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE E.EMPLOYEE_ID = @EmployeeId
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME
END

EXEC getRatingByMonth @MONTH = 12, @YEAR = 2018, @BranchId = 'B001', @EmployeeId = 'E014327'

GO
CREATE PROC getRatingByQuarter
	@Quarter INT,          -- Quý c?n tính toán (1, 2, 3, ho?c 4)
	@Year INT,             -- Nam c?n tính toán
	@BranchId CHAR(4),     -- Mã chi nhánh
	@EmployeeId CHAR(7)    -- Mã nhân viên
AS
BEGIN
	-- Bi?n luu ph?m vi ngày
	DECLARE @StartDate DATE;
	DECLARE @EndDate DATE;

	-- Tính toán ph?m vi ngày c?a quý
	IF @Quarter = 1
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-01-01'; -- Ngày b?t d?u quý 1
		SET @EndDate = CAST(@Year AS VARCHAR) + '-03-31';   -- Ngày k?t thúc quý 1
	END
	ELSE IF @Quarter = 2
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-04-01'; -- Ngày b?t d?u quý 2
		SET @EndDate = CAST(@Year AS VARCHAR) + '-06-30';   -- Ngày k?t thúc quý 2
	END
	ELSE IF @Quarter = 3
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-07-01'; -- Ngày b?t d?u quý 3
		SET @EndDate = CAST(@Year AS VARCHAR) + '-09-30';   -- Ngày k?t thúc quý 3
	END
	ELSE IF @Quarter = 4
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-10-01'; -- Ngày b?t d?u quý 4
		SET @EndDate = CAST(@Year AS VARCHAR) + '-12-31';   -- Ngày k?t thúc quý 4
	END

	-- L?y d? li?u di?m trung bình trong ph?m vi quý
	SELECT 
		E.EMPLOYEE_ID, 
		E.FULL_NAME, 
        AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE 
		E.EMPLOYEE_ID = @EmployeeId
		AND O.ORDER_DATE BETWEEN @StartDate AND @EndDate
	GROUP BY 
		E.EMPLOYEE_ID, 
		E.FULL_NAME;
END

GO
CREATE PROC getRatingByYear
	@YEAR INT,
	@BranchId CHAR(4),
	@EmployeeId CHAR(7)
AS
BEGIN
	SELECT E.EMPLOYEE_ID, 
           E.FULL_NAME, 
           AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE  -- Ép ki?u thành FLOAT
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = @YEAR
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE E.EMPLOYEE_ID = @EmployeeId
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME
END

GO
CREATE PROC payOrder
    @OrderId CHAR(7)
AS
BEGIN
    -- Khai báo các bi?n
    DECLARE @DiscountAmount DECIMAL(18, 2);
    DECLARE @FinalAmount DECIMAL(18, 2);
    DECLARE @NewInvoiceId CHAR(7);
    DECLARE @CurrentMaxInvoiceId INT;

    -- L?y giá tr? l?n nh?t c?a INVOICE_ID hi?n t?i
    SELECT 
        @CurrentMaxInvoiceId = MAX(CAST(SUBSTRING(INVOICE_ID, 2, LEN(INVOICE_ID) - 1) AS INT))
    FROM 
        INVOICE;

    -- T?o INVOICE_ID m?i
    SET @NewInvoiceId = 'I' + RIGHT('000000' + CAST(@CurrentMaxInvoiceId + 1 AS VARCHAR), 6);

    -- Tính giá tr? DiscountAmount
    SELECT 
        @DiscountAmount = ISNULL(MC.DISCOUNT_AMOUNT, 0)
    FROM 
        [ORDER_]
    JOIN 
        CUSTOMER ON CUSTOMER.CUSTOMER_ID = [ORDER_].CUSTOMER_ID
    LEFT JOIN 
        MEMBERSHIP_CARD MC ON MC.CUSTOMER_ID = CUSTOMER.CUSTOMER_ID
    WHERE 
        [ORDER_].ORDER_ID = @OrderId 

    -- Tính t?ng giá tr? don hàng (SUM(QUANTITY * PRICE))
    SELECT 
        @FinalAmount = SUM(OD.QUANTITY * D.DISH_PRICE) - @DiscountAmount
    FROM 
        ORDER_DISH OD
    JOIN 
        DISH D ON D.DISH_ID = OD.DISH_ID
    WHERE 
        OD.ORDER_ID = @OrderId;

    -- N?u FinalAmount < 0 thì gán b?ng 0
    IF @FinalAmount < 0 
        SET @FinalAmount = 0;

    -- Chèn thông tin hóa don vào b?ng INVOICE
    INSERT INTO INVOICE (
        INVOICE_ID, 
        FINAL_AMOUNT, 
        DISCOUNT_AMOUNT, 
        ISSUE_DATE, 
        ISSUE_TIME, 
        ORDER_ID
    )
    VALUES (
        @NewInvoiceId, -- INVOICE_ID m?i
        @FinalAmount,
        @DiscountAmount,
        GETDATE(), -- Ngày hi?n t?i
        CONVERT(TIME, GETDATE()), -- Th?i gian hi?n t?i
        @OrderId
    );
END
GO

GO
CREATE PROC deleteOrder
    @ORDER_ID CHAR(7),
    @ORDER_TYPE NVARCHAR(50),
    @BRANCH_ID CHAR(4)
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Xoá các b?n ghi trong ORDER_DISH
        DELETE FROM ORDER_DISH 
        WHERE ORDER_ID = @ORDER_ID;

        -- Ki?m tra lo?i don hàng và th?c hi?n xoá
        IF @ORDER_TYPE = 'Delivery'
        BEGIN
            DELETE FROM DELIVERY_ORDER
            WHERE DORDER_ID = @ORDER_ID;
        END
        ELSE IF @ORDER_TYPE = 'Offline'
        BEGIN
            -- Xoá t? b?ng OFFLINE_ORDER
            DELETE FROM OFFLINE_ORDER
            WHERE OFORDER_ID = @ORDER_ID;

            -- C?p nh?t tr?ng thái bàn TABLE_
            UPDATE TABLE_
            SET TABLE_STATUS = N'Còn tr?ng'
            FROM TABLE_ T
            JOIN OFFLINE_ORDER O ON T.TABLE_NUM = O.TABLE_NUMBER
            WHERE O.OFORDER_ID = @ORDER_ID AND T.BRANCH_ID = @BRANCH_ID;
        END
        ELSE IF @ORDER_TYPE = 'Online'
        BEGIN
            -- Xoá t? b?ng ONLINE_ORDER
            DELETE FROM ONLINE_ORDER
            WHERE OORDER_ID = @ORDER_ID;
        END

        -- Xoá ORDER
        DELETE FROM ORDER_
        WHERE ORDER_ID = @ORDER_ID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- Rollback khi có l?i
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE getInvoiceByPhone
    @CUSTOMER_PHONE VARCHAR(15) = NULL,
    @DATE DATE = NULL
AS
BEGIN
    -- N?u c? CUSTOMER_PHONE và DATE d?u NULL, tr? v? r?ng
    IF @CUSTOMER_PHONE IS NULL AND @DATE IS NULL
    BEGIN
        -- Tr? v? b?ng tr?ng cho k?t qu? hóa don
        SELECT TOP 0 
            I.INVOICE_ID, 
            I.FINAL_AMOUNT, 
            I.DISCOUNT_AMOUNT, 
            I.ISSUE_DATE, 
            I.ISSUE_TIME
        FROM INVOICE I;

        -- Tr? v? b?ng tr?ng cho danh sách món an
        SELECT TOP 0 
            I.INVOICE_ID,
            OD.DISH_ID,
            OD.QUANTITY AS AMOUNT,
            D.DISH_NAME,
            D.DISH_PRICE
        FROM INVOICE I
        LEFT JOIN ORDER_DISH OD ON I.ORDER_ID = OD.ORDER_ID
        LEFT JOIN DISH D ON D.DISH_ID = OD.DISH_ID;

        RETURN;
    END;

    -- Bi?n d? luu Invoice ID duy nh?t
    DECLARE @InvoiceId CHAR(7);

    -- Tìm khách hàng d?a trên s? di?n tho?i
    DECLARE @CustomerId CHAR(7) = (
        SELECT CUSTOMER_ID 
        FROM CUSTOMER
        WHERE PHONE_NUMBER = @CUSTOMER_PHONE
    );

    -- L?y hóa don phù h?p nh?t d?a trên CUSTOMER_ID và DATE
    SELECT I.INVOICE_ID, I.FINAL_AMOUNT, I.DISCOUNT_AMOUNT, I.ISSUE_DATE, I.ISSUE_TIME
    FROM INVOICE I
    LEFT JOIN [ORDER_] O ON O.ORDER_ID = I.ORDER_ID
    WHERE 
        (@CustomerId IS NULL OR O.CUSTOMER_ID = @CustomerId)
        AND (@DATE IS NULL OR CAST(I.ISSUE_DATE AS DATE) = @DATE)
    ORDER BY I.ISSUE_DATE DESC, I.ISSUE_TIME DESC;

    -- Danh sách món an c?a các hóa don
    SELECT 
        I.INVOICE_ID,
        OD.DISH_ID,
        OD.QUANTITY AS AMOUNT,
        D.DISH_NAME,
        D.DISH_PRICE
    FROM INVOICE I
    LEFT JOIN ORDER_DISH OD ON I.ORDER_ID = OD.ORDER_ID
    LEFT JOIN DISH D ON D.DISH_ID = OD.DISH_ID
    WHERE 
        (@CustomerId IS NULL OR I.ORDER_ID IN (
            SELECT ORDER_ID FROM [ORDER_] WHERE CUSTOMER_ID = @CustomerId
        ))
        AND (@DATE IS NULL OR CAST(I.ISSUE_DATE AS DATE) = @DATE)
    ORDER BY I.INVOICE_ID, D.DISH_NAME;
END;
GO
CREATE PROCEDURE getMembershipCardInfo
    @CustomerID CHAR(7) -- Thay đổi kiểu dữ liệu cho phù hợp
AS
BEGIN
    SELECT *
    FROM MEMBERSHIP_CARD MC
    WHERE MC.CUSTOMER_ID = @CustomerID; -- So sánh trực tiếp, không chuyển đổi kiểu
END





SELECT * FROM TABLE_
SELECT * FROM CUSTOMER
SELECT * FROM MEMBERSHIP_CARD
SELECT * FROM INVOICE
JOIN ORDER_ O ON O.ORDER_ID = INVOICE.ORDER_ID AND O.BRANCH_ID = 'B003'
SELECT * FROM DISH WHERE DISH_ID = 'D015'
select * from ORDER_DISH WHERE ORDER_ID = 'O012016'
select * from ORDER_
select * from DELIVERY_ORDER
SELECT * FROM INVOICE
select * from ACCOUNT A 
select * from RESTAURANT_BRANCH
select * from invoice WHERE YEAR(ISSUE_DATE) = '1997'
SELECT * FROM EMPLOYEE
SELECT * FROM BRANCH_RATING JOIN OFFLINE_ORDER OFO ON OFO.BRANCH_ID = BRANCH_RATING.BRANCH_ID AND OFO.EMPLOYEE_ID = 'E014327' AND YEAR(BRANCH_RATING.RATING_DATE) = 2022
SELECT * FROM OFFLINE_ORDER OFO JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = '2024' ORDER BY OFO.EMPLOYEE_ID
SELECT * FROM ONLINE_ORDER
SELECT * FROM DELIVERY_ORDER
SELECT * FROM OFFLINE_ORDER
SELECT * FROM ORDER_ O
SELECT * FROM TABLE_ WHERE BRANCH_ID = 'B012' AND TABLE_STATUS = N'Còn tr?ng'
JOIN OFFLINE_ORDER OFO ON OFO.OFORDER_ID = O.ORDER_ID AND O.BRANCH_ID = 'B001'
SELECT * FROM ORDER_DISH

SELECT E.EMPLOYEE_ID, E.FULL_NAME,  AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = 2024
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = 'B012'
	WHERE E.EMPLOYEE_ID = 'E000012'
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME

select * from customer